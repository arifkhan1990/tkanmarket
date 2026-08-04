export type BackupSnapshotStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL'

export interface BackupSnapshotRow {
  snapshotId: string
  timestamp: string
  status: BackupSnapshotStatus
  checksum: string
  sizeBytes: number
  sourceLabel: string
}

export interface SystemBackupOverviewResponse {
  healthLabel: 'Healthy' | 'Degraded'
  healthDetail: string
  databaseSizeLabel: string
  storageDestination: string
  encryptionLabel: string
  nextBackupLabel: string
  backupTypeLabel: string
  snapshots: BackupSnapshotRow[]
  retentionNote: string
  validationNote: string
}
