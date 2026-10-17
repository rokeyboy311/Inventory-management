export interface InChargeEngineer {
  name: string;
  designation: string;
  contactNumber: string;
  email?: string;
}

export interface Team {
  id: string; // e.g. "team-dolvan-maintenance"
  name: string; // e.g. "Dolvan Maintenance Team"
  code: string; // e.g. "DLV-01"
  division: string; // e.g. "VYARA"
  subdivision: string; // e.g. "DOLVAN"
  inChargeEngineer: InChargeEngineer;
  members: string[]; // Technician / Assistant names
  locationExcelIds: string[]; // IDs of Location Workbooks associated with this team
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface TeamFormData {
  name: string;
  code: string;
  division: string;
  subdivision: string;
  inChargeName: string;
  inChargeDesignation: string;
  inChargePhone: string;
  inChargeEmail?: string;
  membersText?: string;
}
