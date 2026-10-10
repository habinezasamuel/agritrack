import { api } from './api';
import { normalizeAttendanceResponse } from './attendanceResponse';
import type {
  MeetingItem,
  AdminRegisterReviewSummary,
  FarmerLocationDetails,
  AttendanceStatus,
  AttendanceStats,
  MeetingStatus,
  AttendanceRecordItem,
} from '../types';

export interface CreateMeetingDto {
  title: string;
  description?: string;
  meeting_date: string;
  start_time?: string;
  end_time?: string;
  venue: string;
  district?: string;
  sector?: string;
  agenda?: string;
  category?: string;
  farmer_ids?: number[];
}

export interface RecordAttendanceItemDto {
  farmer_id?: number;
  record_id?: number;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AdminModifyAttendanceDto {
  record_id?: number;
  farmer_id?: number;
  new_status: AttendanceStatus;
  reason: string;
  remarks?: string;
}

interface SavedAttendanceMarks {
  meetingId: number;
  meetingStatus: MeetingStatus;
  statistics: AttendanceStats;
  records: { id: number; status: AttendanceStatus; officerRemarks: string; recordedBy: string | null; recordedAt: string | null; updatedAt: string }[];
}

class AttendanceService {
  async saveEvaluation(meetingId: number, data: Record<string, number | string>): Promise<{ message: string; evaluation: AttendanceRecordItem['evaluation'] }> {
    return normalizeAttendanceResponse(await api.post(`/attendance/meetings/${meetingId}/evaluations/`, data));
  }
  async saveAttendanceMarks(meetingId: number, records: RecordAttendanceItemDto[]): Promise<SavedAttendanceMarks> {
    const url = `/attendance/meetings/${meetingId}/attendance/`;
    try {
      return normalizeAttendanceResponse(await api.post(url, { records, compact_response: true }, { timeout: 30000 }));
    } catch (error) {
      if ((error as Error & { isTimeout?: boolean }).isTimeout) {
        try {
          const confirmation = normalizeAttendanceResponse<SavedAttendanceMarks>(await api.get(url, undefined, { timeout: 15000 }));
          if (records.every((requested) => confirmation.records.some((saved) => saved.id === requested.record_id && saved.status === requested.status && saved.officerRemarks === (requested.remarks || '')))) return confirmation;
        } catch { /* Keep the original save error and the user's choices. */ }
      }
      throw error;
    }
  }
  private pendingMeetingKeys = new Map<string, string>();
  async getMeetingsPage(page = 1): Promise<{ meetings: MeetingItem[]; count: number }> {
    return normalizeAttendanceResponse(await api.get('/attendance/meetings/', { page, page_size: 25 }));
  }

  async getRegisteredFarmersPage(search = '', page = 1): Promise<{ farmers: FarmerLocationDetails[]; count: number }> {
    return normalizeAttendanceResponse(await api.get('/attendance/farmers-roster/', { page, page_size: 50, search }));
  }
  private async saveMeeting(url: string, data?: unknown, submissionKey?: string): Promise<{ message: string; meeting: MeetingItem; audit_id: number }> {
    const response = await api.post<{ message: string; meeting: unknown; audit_id: number }>(url, data, {
      timeout: 30000,
      ...(submissionKey ? { headers: { 'Idempotency-Key': submissionKey } } : {}),
    });
    if (!response.meeting || typeof response.meeting !== 'object' || !('id' in response.meeting)) {
      throw new Error('The server did not confirm the saved meeting. Check your records before submitting again.');
    }
    return { ...response, meeting: normalizeAttendanceResponse<MeetingItem>(response.meeting) };
  }
  /**
   * List meetings based on role.
   */
  async getMeetings(): Promise<MeetingItem[]> {
    const res = await api.get<{ meetings: MeetingItem[]; count: number }>('/attendance/meetings/');
    return normalizeAttendanceResponse<MeetingItem[]>(res.meetings || []);
  }

  /**
   * Get meeting details including invited farmers, records, statistics, and audit history.
   */
  async getMeetingDetail(meetingId: number | string): Promise<MeetingItem> {
    const res = await api.get<{ meeting: MeetingItem }>(`/attendance/meetings/${meetingId}/`);
    return normalizeAttendanceResponse<MeetingItem>(res.meeting);
  }

  /**
   * Create a new meeting (Agricultural Officer ONLY).
   */
  async createMeeting(data: CreateMeetingDto): Promise<{ message: string; meeting: MeetingItem }> {
    const fingerprint = JSON.stringify([api.getUser()?.id, data]);
    const key = this.pendingMeetingKeys.get(fingerprint) || crypto.randomUUID();
    this.pendingMeetingKeys.set(fingerprint, key);
    let result: { message: string; meeting: MeetingItem };
    try {
      result = await this.saveMeeting('/attendance/meetings/', data, key);
    } catch (error) {
      if (!(error as Error & { isTimeout?: boolean }).isTimeout) throw error;
      // Read the committed confirmation rather than blindly repeating a save.
      try {
        result = normalizeAttendanceResponse(await api.get(`/attendance/meeting-submissions/${key}/`, undefined, { timeout: 10000 }));
      } catch {
        throw error;
      }
    }
    this.pendingMeetingKeys.delete(fingerprint);
    return result;
  }

  /**
   * Invite registered farmers to a meeting (Agricultural Officer ONLY).
   */
  async inviteFarmers(meetingId: number | string, farmerIds: number[]): Promise<{ message: string; meeting: MeetingItem }> {
    return this.saveMeeting(`/attendance/meetings/${meetingId}/invite/`, {
      farmer_ids: farmerIds,
    });
  }

  /**
   * Generate initial attendance register (Agricultural Officer ONLY).
   * Generates from real invited farmers in database with status UNRECORDED.
   * Admin cannot call this.
   */
  async generateAttendanceRegister(meetingId: number | string): Promise<{ message: string; meeting: MeetingItem }> {
    return this.saveMeeting(`/attendance/meetings/${meetingId}/generate-register/`);
  }

  /**
   * Record and save attendance register to Neon PostgreSQL (Agricultural Officer ONLY).
   */
  async recordAttendance(
    meetingId: number | string,
    records: RecordAttendanceItemDto[]
  ): Promise<{ message: string; meeting: MeetingItem }> {
    return this.saveMeeting(`/attendance/meetings/${meetingId}/attendance/`, {
      records,
    });
  }

  /**
   * Finalize the attendance register after the meeting (Agricultural Officer ONLY).
   */
  async finalizeAttendanceRegister(meetingId: number | string): Promise<{ message: string; meeting: MeetingItem }> {
    try {
      return await this.saveMeeting(`/attendance/meetings/${meetingId}/finalize-register/`);
    } catch (error) {
      if ((error as Error & { isTimeout?: boolean }).isTimeout) {
        try {
          const meeting = await this.getMeetingDetail(meetingId);
          if (meeting.register?.isFinalized) return { message: 'Attendance register finalized successfully.', meeting };
        } catch { /* Preserve the save error when the database cannot confirm it. */ }
      }
      throw error;
    }
  }

  /**
   * Administrator Attendance Review: List all registers generated by officers (Administrator ONLY).
   */
  async getAdminAttendanceRegisters(): Promise<AdminRegisterReviewSummary[]> {
    const res = await api.get<{ registers: AdminRegisterReviewSummary[]; count: number }>(
      '/attendance/admin/attendance-review/'
    );
    return normalizeAttendanceResponse<AdminRegisterReviewSummary[]>(res.registers || []);
  }

  /**
   * Administrator Attendance Review: Modify an existing attendance status with permanent audit history (Administrator ONLY).
   */
  async adminModifyAttendance(
    meetingId: number | string,
    data: AdminModifyAttendanceDto
  ): Promise<{ message: string; audit_id: number; meeting: MeetingItem }> {
    return this.saveMeeting(
      `/attendance/admin/attendance-review/${meetingId}/modify/`,
      data
    );
  }

  /**
   * Get list of all registered farmers stored in database for invitations.
   */
  async getRegisteredFarmers(): Promise<FarmerLocationDetails[]> {
    const res = await api.get<{ farmers: FarmerLocationDetails[]; count: number }>('/attendance/farmers-roster/');
    return normalizeAttendanceResponse<FarmerLocationDetails[]>(res.farmers || []);
  }
}

export const attendanceService = new AttendanceService();
