export interface InChargeEngineer {
  name?: string;
  designation?: string;
  contactNumber?: string;
  email?: string;
}

export interface Team {
  id: string; // e.g. "team-dolvan-maintenance"
  name: string; // e.g. "Dolvan Maintenance Team"
  members: string[]; // Technician / Assistant names
  locationExcelIds: string[]; // IDs of Location Workbooks associated with this team
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Legacy fields made optional for backward compatibility
  code?: string;
  division?: string;
  subdivision?: string;
  inChargeEngineer?: InChargeEngineer;
}

export interface TeamFormData {
  name: string;
  membersText?: string;
  // Optional legacy fields for backward compatibility
  code?: string;
  division?: string;
  subdivision?: string;
  inChargeName?: string;
  inChargeDesignation?: string;
  inChargePhone?: string;
  inChargeEmail?: string;
}
