import type { 
  LivestockAnimal, 
  AnimalDiseaseReport, 
  FeedShortageReport, 
  LivestockHealthRecord, 
  LivestockSummaryStats 
} from '../types';

const ANIMALS_STORAGE_KEY = 'agritrack_livestock_animals';
const DISEASE_REPORTS_KEY = 'agritrack_disease_reports';
const FEED_SHORTAGES_KEY = 'agritrack_feed_shortages';
const HEALTH_RECORDS_KEY = 'agritrack_livestock_health_records';

const INITIAL_ANIMALS: LivestockAnimal[] = [
  {
    id: '1',
    farmerId: '3',
    farmerName: 'Paul Mukamana',
    farmId: '1',
    farmName: 'Ruhango Farm',
    location: 'Ruhango Sector, District Field A',
    animalType: 'cow',
    tagId: 'RW-COW-104 (Inyange)',
    breed: 'Friesian Holstein',
    quantity: 1,
    dobOrAge: '3 years',
    gender: 'female',
    healthStatus: 'HEALTHY',
    registrationDate: '2025-01-15',
    notes: 'High yield dairy cow producing 24L milk daily. Fully vaccinated.',
    photoUrl: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  },
  {
    id: '2',
    farmerId: '3',
    farmerName: 'Paul Mukamana',
    farmId: '1',
    farmName: 'Ruhango Farm',
    location: 'Ruhango Sector, Barn B',
    animalType: 'cow',
    tagId: 'RW-COW-108 (Mihigo)',
    breed: 'Local Anchor Cross',
    quantity: 1,
    dobOrAge: '2 years',
    gender: 'female',
    healthStatus: 'SICK',
    registrationDate: '2025-06-10',
    notes: 'Showing symptoms of reduced appetite and mild fever.',
    photoUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-06-10T09:30:00Z',
    updatedAt: '2026-10-05T14:20:00Z',
  },
  {
    id: '3',
    farmerId: '3',
    farmerName: 'Paul Mukamana',
    farmId: '1',
    farmName: 'Ruhango Farm',
    location: 'Pasture Area C',
    animalType: 'goat',
    tagId: 'GOAT-FLOCK-01 (Gicumbi Goats)',
    breed: 'Boer Local Cross',
    quantity: 12,
    dobOrAge: '1.5 years avg',
    gender: 'group',
    healthStatus: 'HEALTHY',
    registrationDate: '2025-03-20',
    notes: 'Healthy herd raised for milk and breeding.',
    photoUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-03-20T11:00:00Z',
    updatedAt: '2026-09-12T16:00:00Z',
  },
  {
    id: '4',
    farmerId: '3',
    farmerName: 'Paul Mukamana',
    farmId: '1',
    farmName: 'Ruhango Farm',
    location: 'Poultry House 1',
    animalType: 'chicken',
    tagId: 'POULTRY-LAYER-BATCH-A',
    breed: 'ISA Brown Layers',
    quantity: 50,
    dobOrAge: '8 months',
    gender: 'group',
    healthStatus: 'HEALTHY',
    registrationDate: '2026-02-01',
    notes: 'Layer batch with 92% daily egg production rate.',
    photoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-02-01T07:15:00Z',
    updatedAt: '2026-10-08T18:00:00Z',
  },
  {
    id: '5',
    farmerId: '3',
    farmerName: 'Paul Mukamana',
    farmId: '1',
    farmName: 'Ruhango Farm',
    location: 'Pen 4',
    animalType: 'pig',
    tagId: 'PIG-04 (Landrace Pair)',
    breed: 'Landrace White',
    quantity: 2,
    dobOrAge: '1 year',
    gender: 'male',
    healthStatus: 'HEALTHY',
    registrationDate: '2025-11-05',
    notes: 'Breeding boars under balanced protein diet.',
    photoUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-11-05T10:00:00Z',
    updatedAt: '2026-08-20T12:00:00Z',
  },
];

const INITIAL_DISEASE_REPORTS: AnimalDiseaseReport[] = [
  {
    id: '1',
    reportNumber: 'ADR-20261005-001',
    farmerId: '3',
    farmerName: 'Paul Mukamana',
    farmerPhone: '+250 788 123 456',
    animalId: '2',
    animalTagId: 'RW-COW-108 (Mihigo)',
    animalType: 'Cow',
    farmId: '1',
    farmName: 'Ruhango Farm',
    location: 'Ruhango Sector, Barn B',
    symptoms: 'Loss of appetite, high temperature (40.2°C), mild drooling and lethargy.',
    problemStartDate: '2026-10-04',
    numberAffected: 1,
    description: 'Noticeable reduction in milk yield and reluctant to stand up. Requires urgent veterinary check.',
    evidenceUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
    urgencyLevel: 'HIGH',
    status: 'UNDER_REVIEW',
    veterinaryRecommendation: 'Keep cow isolated in a dry shaded stall. Provide clean water mixed with oral electrolytes. Field vet scheduled for visit.',
    recommendFarmVisit: true,
    farmVisitDate: '2026-10-10',
    assignedOfficerId: '2',
    assignedOfficerName: 'Dr. Jean-Paul Habimana (Veterinary Officer)',
    createdAt: '2026-10-05T08:30:00Z',
    updatedAt: '2026-10-06T11:00:00Z',
  },
];

const INITIAL_FEED_SHORTAGES: FeedShortageReport[] = [
  {
    id: '1',
    reportNumber: 'FSR-20261007-002',
    farmerId: '3',
    farmerName: 'Paul Mukamana',
    farmerPhone: '+250 788 123 456',
    farmId: '1',
    farmName: 'Ruhango Farm',
    location: 'Ruhango Sector',
    animalType: 'Cows & Goats',
    numberAffected: 14,
    feedTypeNeeded: 'Napier Grass, Silage & Protein Concentrate',
    description: 'Prolonged dry period has exhausted communal pasture. Need supplemental fodder and silage for dairy cattle.',
    estimatedQuantityRequired: '400 kg Napier grass & 100 kg dairy concentrate',
    shortageStartDate: '2026-10-05',
    evidenceUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    urgencyLevel: 'MEDIUM',
    status: 'PENDING',
    officerNotes: 'Reviewing feed bank distribution availability for Southern Province cooperatives.',
    createdAt: '2026-10-07T14:00:00Z',
    updatedAt: '2026-10-07T14:00:00Z',
  },
];

const INITIAL_HEALTH_RECORDS: LivestockHealthRecord[] = [
  {
    id: '1',
    animalId: '1',
    animalTagId: 'RW-COW-104 (Inyange)',
    farmerId: '3',
    recordType: 'VACCINATION',
    date: '2026-09-15',
    title: 'FMD (Foot-and-Mouth Disease) Booster Vaccination',
    details: 'Administered 2ml FMD trivalent vaccine subcutaneously.',
    veterinarianName: 'Dr. Jean-Paul Habimana',
    prescribedMedicine: 'FMD Trivalent Vaccine',
    costRwf: 5000,
    nextDueDate: '2026-10-15',
    reminderActive: true,
    createdAt: '2026-09-15T09:00:00Z',
  },
  {
    id: '2',
    animalId: '1',
    animalTagId: 'RW-COW-104 (Inyange)',
    farmerId: '3',
    recordType: 'VET_VISIT',
    date: '2026-10-01',
    title: 'Routine Health Check & Reproductive Ultrasound',
    details: 'Physical exam clear. Confirmed early pregnancy (2 months). Excellent body condition score 3.5/5.',
    veterinarianName: 'Dr. Jean-Paul Habimana',
    prescribedMedicine: 'Multivitamin Infusion',
    costRwf: 12000,
    nextDueDate: '2026-11-01',
    reminderActive: true,
    createdAt: '2026-10-01T11:30:00Z',
  },
  {
    id: '3',
    animalId: '4',
    animalTagId: 'POULTRY-LAYER-BATCH-A',
    farmerId: '3',
    recordType: 'PRODUCTION',
    date: '2026-10-08',
    title: 'Daily Egg Production Record',
    details: 'Collected 46 fresh eggs from 50 ISA Brown layers.',
    quantity: 46,
    unit: 'Eggs',
    costRwf: 6900,
    createdAt: '2026-10-08T17:00:00Z',
  },
  {
    id: '4',
    animalId: '1',
    animalTagId: 'RW-COW-104 (Inyange)',
    farmerId: '3',
    recordType: 'FEEDING',
    date: '2026-10-08',
    title: 'High-Protein Dairy Ration Meal',
    details: 'Fed 15kg green fodder, 4kg maize bran concentrate, and mineral salt lick block.',
    quantity: 19,
    unit: 'KG',
    costRwf: 4500,
    createdAt: '2026-10-08T07:00:00Z',
  },
];

export function getStoredAnimals(): LivestockAnimal[] {
  const data = localStorage.getItem(ANIMALS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(ANIMALS_STORAGE_KEY, JSON.stringify(INITIAL_ANIMALS));
    return INITIAL_ANIMALS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_ANIMALS;
  }
}

export function saveStoredAnimals(animals: LivestockAnimal[]) {
  localStorage.setItem(ANIMALS_STORAGE_KEY, JSON.stringify(animals));
}

export function getStoredDiseaseReports(): AnimalDiseaseReport[] {
  const data = localStorage.getItem(DISEASE_REPORTS_KEY);
  if (!data) {
    localStorage.setItem(DISEASE_REPORTS_KEY, JSON.stringify(INITIAL_DISEASE_REPORTS));
    return INITIAL_DISEASE_REPORTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_DISEASE_REPORTS;
  }
}

export function saveStoredDiseaseReports(reports: AnimalDiseaseReport[]) {
  localStorage.setItem(DISEASE_REPORTS_KEY, JSON.stringify(reports));
}

export function getStoredFeedShortages(): FeedShortageReport[] {
  const data = localStorage.getItem(FEED_SHORTAGES_KEY);
  if (!data) {
    localStorage.setItem(FEED_SHORTAGES_KEY, JSON.stringify(INITIAL_FEED_SHORTAGES));
    return INITIAL_FEED_SHORTAGES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_FEED_SHORTAGES;
  }
}

export function saveStoredFeedShortages(reports: FeedShortageReport[]) {
  localStorage.setItem(FEED_SHORTAGES_KEY, JSON.stringify(reports));
}

export function getStoredHealthRecords(): LivestockHealthRecord[] {
  const data = localStorage.getItem(HEALTH_RECORDS_KEY);
  if (!data) {
    localStorage.setItem(HEALTH_RECORDS_KEY, JSON.stringify(INITIAL_HEALTH_RECORDS));
    return INITIAL_HEALTH_RECORDS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_HEALTH_RECORDS;
  }
}

export function saveStoredHealthRecords(records: LivestockHealthRecord[]) {
  localStorage.setItem(HEALTH_RECORDS_KEY, JSON.stringify(records));
}

export function computeLivestockStats(
  animals: LivestockAnimal[], 
  diseaseReports: AnimalDiseaseReport[], 
  feedShortages: FeedShortageReport[],
  healthRecords: LivestockHealthRecord[]
): LivestockSummaryStats {
  const totalAnimals = animals.length;
  const totalHeadCount = animals.reduce((sum, a) => sum + (a.quantity || 1), 0);
  
  const animalsByType: Record<string, number> = {};
  animals.forEach((a) => {
    animalsByType[a.animalType] = (animalsByType[a.animalType] || 0) + (a.quantity || 1);
  });

  const healthyCount = animals.filter((a) => a.healthStatus === 'HEALTHY').reduce((s, a) => s + (a.quantity || 1), 0);
  const sickCount = animals.filter((a) => a.healthStatus === 'SICK').reduce((s, a) => s + (a.quantity || 1), 0);
  const underTreatmentCount = animals.filter((a) => a.healthStatus === 'UNDER_TREATMENT').reduce((s, a) => s + (a.quantity || 1), 0);

  const openDiseaseReports = diseaseReports.filter((r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length;
  const openFeedShortages = feedShortages.filter((r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length;

  const today = new Date().toISOString().split('T')[0];
  const upcomingVaccinationsCount = healthRecords.filter(
    (r) => r.recordType === 'VACCINATION' && r.nextDueDate && r.nextDueDate >= today && r.reminderActive
  ).length;

  const resolvedRequestsCount = 
    diseaseReports.filter((r) => r.status === 'RESOLVED' || r.status === 'ASSISTANCE_PROVIDED').length +
    feedShortages.filter((r) => r.status === 'RESOLVED' || r.status === 'ASSISTANCE_COORDINATED').length;

  return {
    totalAnimals,
    totalHeadCount,
    animalsByType,
    healthyCount,
    sickCount,
    underTreatmentCount,
    openDiseaseReports,
    openFeedShortages,
    upcomingVaccinationsCount,
    resolvedRequestsCount,
  };
}
