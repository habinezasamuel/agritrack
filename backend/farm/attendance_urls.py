from django.urls import path
from . import attendance_views

urlpatterns = [
    # Meetings & Attendance Register (Officer / All authorized)
    path('meetings/', attendance_views.meetings_list_create, name='meetings_list_create'),
    path('meetings/<int:meeting_id>/', attendance_views.meeting_detail, name='meeting_detail'),
    path('meetings/<int:meeting_id>/invite/', attendance_views.invite_farmers, name='invite_farmers'),
    path('meetings/<int:meeting_id>/generate-register/', attendance_views.generate_attendance_register, name='generate_attendance_register'),
    path('meetings/<int:meeting_id>/attendance/', attendance_views.record_attendance, name='record_attendance'),
    path('meetings/<int:meeting_id>/finalize-register/', attendance_views.finalize_attendance_register, name='finalize_attendance_register'),

    # Administrator Attendance Review & Modifications
    path('admin/attendance-review/', attendance_views.admin_attendance_review_list, name='admin_attendance_review_list'),
    path('admin/attendance-review/<int:meeting_id>/modify/', attendance_views.admin_modify_attendance, name='admin_modify_attendance'),

    # Registered Farmers for Invitations
    path('farmers-roster/', attendance_views.registered_farmers_list, name='registered_farmers_list'),
]
