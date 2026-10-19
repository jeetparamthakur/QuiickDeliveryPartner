export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export type KycDocumentType = 'aadhaar' | 'pan' | 'driving_license' | 'selfie';

export type KycDocument = {
  id: string;
  type: KycDocumentType;
  uri: string;
  uploadedAt: string;
};

export type KycInfo = {
  status: KycStatus;
  documents: KycDocument[];
  rejectionReason?: string;
};

export type BankAccount = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
};

export type PayoutStatus = 'completed' | 'processing' | 'failed';

export type Payout = {
  id: string;
  amount: number;
  status: PayoutStatus;
  date: string;
  reference?: string;
};

export type EarningsSummary = {
  today: number;
  week: number;
  month: number;
  total: number;
  pendingSettlement: number;
  availableBalance: number;
  nextSettlement: number;
  nextSettlementDate: string;
};

export type EarningsChartPoint = {
  label: string;
  value: number;
};

export type ShiftHistoryEntry = {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  deliveriesCompleted: number;
  earnings: number;
};

export type PartnerOnlineStatus = {
  isOnline: boolean;
  currentShiftStartedAt: string | null;
  todayOnlineMinutes: number;
};
