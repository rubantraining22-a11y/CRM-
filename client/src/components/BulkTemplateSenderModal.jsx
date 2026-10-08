import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, UploadCloud, FileSpreadsheet, Download, AlertCircle, 
  CheckCircle2, Loader, Send, RefreshCw, FileText, Image as ImageIcon,
  Check, AlertTriangle, Users, ArrowRight, ShieldCheck, ChevronDown
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * Extract variable placeholders from WhatsApp template components
 * Handles both {{1}}, {{2}} and {{name}}, {{model}}
 */
export const getTemplateVariables = (template) => {
  if (!template || !Array.isArray(template.components)) return [];
  const vars = [];
  const bodyComp = template.components.find(c => c.type === 'BODY');
  if (bodyComp?.text) {
    const matches = bodyComp.text.matchAll(/\{\{(\d+|[a-zA-Z0-9_]+)\}\}/g);
    for (const match of matches) {
      const v = match[1];
      if (!vars.includes(v)) {
        vars.push(v);
      }
    }
  }
  return vars;
};

/**
 * Check if template has an IMAGE, VIDEO, or DOCUMENT header
 */
export const getTemplateMediaHeader = (template) => {
  if (!template || !Array.isArray(template.components)) return null;
  const header = template.components.find(c => c.type === 'HEADER');
  if (header && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format?.toUpperCase())) {
    return header.format.toUpperCase();
  }
  return null;
};

const BulkTemplateSenderModal = ({ onClose, onCompleted }) => {
  // Templates state
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Media header state
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);

  // CSV / File state
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validRowCount, setValidRowCount] = useState(0);

  // Sending & Progress state
  const [isSending, setIsSending] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [campaignResult, setCampaignResult] = useState(null);

  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);

  // 1. Fetch live APPROVED templates from WhatsApp Business API
  const fetchApprovedTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get('/webhooks/templates');
      const allTemplates = res.data?.templates || [];
      // Filter ONLY APPROVED status templates
      const approved = allTemplates.filter(t => t.status === 'APPROVED');
      setTemplates(approved);
      if (approved.length > 0 && !selectedTemplate) {
        // default to first non-hello_world approved template
        const defaultT = approved.find(t => t.name !== 'hello_world') || approved[0];
        setSelectedTemplate(defaultT);
      }
    } catch (err) {
      toast.error('Failed to load approved templates: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchApprovedTemplates();
  }, []);

  // Compute required columns for selected template
  const templateVars = useMemo(() => {
    return getTemplateVariables(selectedTemplate);
  }, [selectedTemplate]);

  const mediaHeaderFormat = useMemo(() => {
    return getTemplateMediaHeader(selectedTemplate);
  }, [selectedTemplate]);

  // Derive required CSV column names:
  // always 'phone_number', plus each variable (var_1, var_2 or placeholder name)
  const requiredColumns = useMemo(() => {
    const cols = ['phone_number'];
    templateVars.forEach(v => {
      // standard naming convention: var_1, var_2 or custom name
      cols.push(isNaN(Number(v)) ? v : `var_${v}`);
    });
    return cols;
  }, [templateVars]);

  // Clean preview text of body with highlights
  const bodyText = useMemo(() => {
    return selectedTemplate?.components?.find(c => c.type === 'BODY')?.text || '';
  }, [selectedTemplate]);

  // Handle template selection change
  const handleSelectTemplate = (t) => {
    setSelectedTemplate(t);
    setMediaFile(null);
    setMediaPreviewUrl(null);
    // Reset file and re-validate if CSV already uploaded
    if (csvFile) {
      revalidateFile(csvFile, t);
    }
  };

  // 2. Download sample CSV button
  const handleDownloadSampleCsv = () => {
    if (!selectedTemplate) return;

    // Build sample row
    const sampleRow = { phone_number: '919843314311' };
    templateVars.forEach((v, idx) => {
      const colName = isNaN(Number(v)) ? v : `var_${v}`;
      sampleRow[colName] = idx === 0 ? 'Ramesh Kumar' : idx === 1 ? 'Tata Nexon' : 'Offer 2026';
    });

    const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: requiredColumns });
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_${selectedTemplate.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Sample CSV downloaded for ${selectedTemplate.name}!`);
  };

  // 3. Client-side validation: parses CSV and runs all checks
  const validateParsedData = (rows, currentTemplate) => {
    const currentVars = getTemplateVariables(currentTemplate);
    const currentRequired = ['phone_number', ...currentVars.map(v => isNaN(Number(v)) ? v : `var_${v}`)];

    const errors = [];
    if (!rows || rows.length < 2) {
      errors.push('CSV file is empty or missing data rows.');
      setValidationErrors(errors);
      setValidRowCount(0);
      return;
    }

    // Header row check
    const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
    setParsedHeaders(rows[0]);

    // Check every required column
    for (const reqCol of currentRequired) {
      const target = reqCol.toLowerCase();
      // Allow exact, or if reqCol is var_1 also allow 1
      const found = headerRow.some(h => 
        h === target || 
        h === target.replace('var_', '') || 
        h === `var_${target}`
      );
      if (!found) {
        errors.push(`Missing required column: "${reqCol}"`);
      }
    }

    // Phone column index
    const phoneIdx = headerRow.findIndex(h => h === 'phone_number');

    // Data rows validation
    let validCount = 0;
    const dataRows = rows.slice(1).filter(r => r && r.some(c => String(c).trim() !== ''));

    dataRows.forEach((row, rIdx) => {
      const rowNumber = rIdx + 2; // Row 1 is header, so data starts at row 2
      const rawPhone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : '';

      // Every phone_number cell matches /^\d{10,15}$/ (digits only, no +, no spaces, no dashes)
      if (!/^\d{10,15}$/.test(rawPhone)) {
        errors.push(
          `Row ${rowNumber}: invalid phone_number "${rawPhone || '(empty)'}" (must be 10–15 digits only, no + or spaces)`
        );
      }

      // Check required variable columns are non-empty per row
      currentVars.forEach(v => {
        const colName = isNaN(Number(v)) ? v : `var_${v}`;
        const colIdx = headerRow.findIndex(h => 
          h === colName.toLowerCase() || 
          h === String(v).toLowerCase() || 
          h === `var_${v}`.toLowerCase()
        );
        const cellVal = colIdx !== -1 ? String(row[colIdx] || '').trim() : '';
        if (!cellVal) {
          errors.push(`Row ${rowNumber}: missing value for column "${colName}"`);
        }
      });

      if (!errors.some(e => e.startsWith(`Row ${rowNumber}:`))) {
        validCount++;
      }
    });

    setValidationErrors(errors);
    setValidRowCount(errors.length === 0 ? dataRows.length : 0);
  };

  const revalidateFile = (file, tmpl) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const rawSheet = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1, defval: '' });
        setParsedRows(rawSheet);
        validateParsedData(rawSheet, tmpl);
      } catch (err) {
        setValidationErrors([`Failed to parse CSV file: ${err.message}`]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle CSV file selection
  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvFileName(file.name);
    revalidateFile(file, selectedTemplate);
  };

  // Handle Header Media Upload
  const handleMediaFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 16MB)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Media file exceeds 16MB limit');
      return;
    }

    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreviewUrl(url);
    toast.success(`Header ${mediaHeaderFormat} attached: ${file.name}`);
  };

  // Auto-download Excel report on completion
  const downloadExcelReport = (reportData) => {
    try {
      const rows = reportData?.rows || [];
      const exportData = rows.map((r, i) => ({
        '#': i + 1,
        'Original Phone': r.phone_number,
        'Normalized Phone': r.normalized_phone || r.phone_number,
        'Delivery Status': r.status === 'sent' ? 'SENT' : 'FAILED',
        'WhatsApp Message ID': r.message_id || 'N/A',
        'Failure Reason / Notes': r.error || 'Successfully dispatched',
        'Timestamp': r.timestamp || new Date().toISOString(),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-fit column widths
      const colWidths = [
        { wch: 5 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 35 },
        { wch: 30 },
        { wch: 25 },
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Delivery Report');
      const filename = `WhatsApp_Bulk_Report_${reportData.template_name || 'Campaign'}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('📊 Delivery report Excel file downloaded!');
    } catch (err) {
      console.error('Failed to export Excel report:', err);
    }
  };

  // 4. On Send: Upload media first (if any) -> POST CSV + template_name + media_id
  const handleSend = async () => {
    if (!selectedTemplate) {
      toast.error('Please select an approved template');
      return;
    }

    if (!csvFile) {
      toast.error('Please upload your filled CSV file');
      return;
    }

    if (validationErrors.length > 0) {
      toast.error('Please resolve all validation errors before sending');
      return;
    }

    if (mediaHeaderFormat && !mediaFile) {
      toast.error(`Please upload the required header ${mediaHeaderFormat} file`);
      return;
    }

    setIsSending(true);
    setProgressPercent(10);
    setProgressStatus('Initializing campaign batch...');

    let uploadedMediaId = null;

    try {
      // Step A: Upload header media if required
      if (mediaHeaderFormat && mediaFile) {
        setProgressPercent(25);
        setProgressStatus(`Uploading header ${mediaHeaderFormat} to WhatsApp Cloud API...`);
        
        const mediaFormData = new FormData();
        mediaFormData.append('file', mediaFile);

        const mediaRes = await api.post('/campaigns/upload-media', mediaFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (!mediaRes.data?.media_id) {
          throw new Error(mediaRes.data?.error || 'Failed to upload header media to Meta');
        }
        uploadedMediaId = mediaRes.data.media_id;
      }

      // Step B: Send bulk upload request
      setProgressPercent(45);
      setProgressStatus('Validating CSV & dispatching personalized WhatsApp templates...');

      // Simulate step progress for user visibility
      const interval = setInterval(() => {
        setProgressPercent(prev => (prev < 90 ? prev + 5 : prev));
      }, 500);

      const bulkFormData = new FormData();
      bulkFormData.append('file', csvFile);
      bulkFormData.append('template_name', selectedTemplate.name);
      if (uploadedMediaId) {
        bulkFormData.append('media_id', uploadedMediaId);
      }

      const res = await api.post('/campaigns/bulk-upload', bulkFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(interval);
      setProgressPercent(100);
      setProgressStatus('Campaign completed! Generating Excel report...');

      const result = res.data;
      setCampaignResult(result);

      // Auto-download Excel report
      downloadExcelReport(result);

      toast.success(`🎉 Campaign completed! Sent: ${result.totalSent}, Failed: ${result.totalFailed}`);

      if (onCompleted) {
        onCompleted(result);
      }
    } catch (err) {
      toast.error('Bulk Send Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 820, 
          width: '95vw', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800 }}>WhatsApp Bulk Template Send</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                Send approved Meta templates to recipient lists with personalized per-row variables via CSV
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          
          {/* STEP 1: Select Approved Template */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                1. SELECT APPROVED WHATSAPP TEMPLATE *
              </label>
              <button 
                type="button"
                onClick={fetchApprovedTemplates} 
                className="btn-secondary" 
                style={{ padding: '3px 9px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={11} className={loadingTemplates ? 'spin' : ''} />
                <span>Refresh Templates</span>
              </button>
            </div>

            {loadingTemplates ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader size={20} className="spin" style={{ margin: '0 auto 6px' }} />
                <p style={{ fontSize: 12 }}>Fetching approved templates from Meta WABA...</p>
              </div>
            ) : templates.length === 0 ? (
              <div style={{ padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#ef4444', fontSize: 12.5 }}>
                No APPROVED templates found in your WhatsApp Business Account. Please verify your templates in Meta Business Manager.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {templates.map(t => {
                  const isSelected = selectedTemplate?.name === t.name;
                  const isRestricted = t.name === 'hello_world';
                  const vars = getTemplateVariables(t);
                  const mediaH = getTemplateMediaHeader(t);

                  return (
                    <div
                      key={t.name}
                      onClick={() => !isRestricted && handleSelectTemplate(t)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: `1.5px solid ${isSelected ? '#10b981' : 'var(--border-card)'}`,
                        background: isSelected ? 'rgba(16,185,129,0.08)' : 'var(--bg-tertiary)',
                        cursor: isRestricted ? 'not-allowed' : 'pointer',
                        opacity: isRestricted ? 0.5 : 1,
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: isSelected ? '#10b981' : 'var(--text-primary)' }}>
                            {t.name}
                          </span>
                          <span style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 99,
                            fontWeight: 800,
                            background: 'rgba(16,185,129,0.15)',
                            color: '#10b981',
                          }}>
                            APPROVED
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Language: {t.language} • {t.category}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {vars.length > 0 && (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 700 }}>
                            {vars.length} Variable{vars.length > 1 ? 's' : ''} ({vars.map(v => isNaN(Number(v)) ? v : `{{${v}}}`).join(', ')})
                          </span>
                        )}
                        {mediaH && (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 700 }}>
                            📷 {mediaH} Header
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedTemplate && (
            <>
              {/* Template Body Preview & Required Columns derived from template */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>
                    TEMPLATE PREVIEW & REQUIRED CSV COLUMNS
                  </span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {requiredColumns.map(col => (
                      <span key={col} style={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: col === 'phone_number' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                        color: col === 'phone_number' ? '#10b981' : '#3b82f6',
                        border: `1px solid ${col === 'phone_number' ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
                      }}>
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 110,
                  overflowY: 'auto',
                }}>
                  {bodyText}
                </div>
              </div>

              {/* STEP 2: Media Header File Upload (Only if template has media header) */}
              {mediaHeaderFormat && (
                <div style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ImageIcon size={18} color="#f59e0b" />
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#f59e0b' }}>
                        2. UPLOAD HEADER {mediaHeaderFormat} (REQUIRED FOR THIS TEMPLATE)
                      </span>
                    </div>
                    {mediaFile && (
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={12} /> Ready
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    This template includes a <strong>{mediaHeaderFormat}</strong> header. One shared media file will be attached for all batch recipients.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input 
                      type="file" 
                      ref={mediaInputRef}
                      onChange={handleMediaFileChange} 
                      accept={mediaHeaderFormat === 'IMAGE' ? 'image/*' : mediaHeaderFormat === 'VIDEO' ? 'video/*' : '.pdf,.doc,.docx'} 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      type="button"
                      onClick={() => mediaInputRef.current?.click()} 
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <UploadCloud size={14} />
                      <span>{mediaFile ? 'Change Media File' : `Choose Header ${mediaHeaderFormat}`}</span>
                    </button>
                    {mediaFile && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        📎 {mediaFile.name} ({(mediaFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>

                  {mediaPreviewUrl && mediaHeaderFormat === 'IMAGE' && (
                    <div style={{ marginTop: 12 }}>
                      <img 
                        src={mediaPreviewUrl} 
                        alt="Header preview" 
                        style={{ maxHeight: 120, borderRadius: 8, border: '1px solid var(--border-card)' }} 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: CSV File Upload & Sample Download */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                    {mediaHeaderFormat ? '3.' : '2.'} UPLOAD RECIPIENT CSV FILE *
                  </label>
                  <button 
                    type="button"
                    onClick={handleDownloadSampleCsv} 
                    className="btn-secondary" 
                    style={{
                      padding: '5px 12px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.3)',
                      background: 'rgba(16,185,129,0.08)'
                    }}
                  >
                    <Download size={13} />
                    <span>Download sample CSV</span>
                  </button>
                </div>

                {/* Drag and Drop / File Input Box */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-card)',
                    borderRadius: 12,
                    padding: '24px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: csvFile ? 'rgba(16,185,129,0.04)' : 'var(--bg-card)',
                    transition: 'all 0.2s',
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleCsvFileChange} 
                    accept=".csv,text/csv,application/vnd.ms-excel" 
                    style={{ display: 'none' }} 
                  />
                  <FileSpreadsheet size={36} color={csvFile ? '#10b981' : 'var(--text-muted)'} style={{ margin: '0 auto 10px', opacity: 0.8 }} />
                  {csvFileName ? (
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{csvFileName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Click to select a different CSV file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                        Click to upload your filled CSV
                      </p>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                        Must include column: <code>phone_number</code> {templateVars.length > 0 ? `and variables: ${requiredColumns.slice(1).join(', ')}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Errors Box (Shown if any error exists) */}
              {validationErrors.length > 0 && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <AlertTriangle size={18} color="#ef4444" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>
                      CSV Validation Failed ({validationErrors.length} Issue{validationErrors.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>
                    Please fix the following errors in your CSV file before dispatching:
                  </p>
                  <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {validationErrors.map((err, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: '#ef4444', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontWeight: 700 }}>•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table & Valid Rows Count (When CSV parsed without errors) */}
              {csvFile && validationErrors.length === 0 && parsedRows.length > 1 && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#10b981' }}>
                        Validation Passed: {parsedRows.length - 1} Recipient{parsedRows.length - 1 > 1 ? 's' : ''} Ready
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Previewing first 5 rows
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-card)' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800 }}>#</th>
                          {parsedRows[0].map((h, i) => (
                            <th key={i} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800 }}>
                              {String(h)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(1, 6).map((r, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{rIdx + 1}</td>
                            {parsedRows[0].map((_, cIdx) => (
                              <td key={cIdx} style={{ padding: '6px 10px', color: 'var(--text-primary)', fontFamily: cIdx === 0 ? 'monospace' : 'inherit' }}>
                                {String(r[cIdx] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress Bar (While sending) */}
              {isSending && (
                <div style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 20,
                  border: '1px solid var(--border-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Loader size={14} className="spin" color="#10b981" />
                      {progressStatus}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#10b981' }}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                      borderRadius: 99,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Campaign Result Summary (After sending completes) */}
              {campaignResult && (
                <div style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={18} color="#10b981" />
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>
                        Batch Dispatched Successfully!
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => downloadExcelReport(campaignResult)}
                      className="btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Download size={12} />
                      <span>Re-download Excel Report</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
                    <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-card)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>TOTAL RECIPIENTS</span>
                      <p style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{campaignResult.total_rows || campaignResult.rows?.length || 0}</p>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-card)' }}>
                      <span style={{ fontSize: 11, color: '#10b981' }}>SUCCESSFULLY SENT</span>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{campaignResult.totalSent}</p>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-card)' }}>
                      <span style={{ fontSize: 11, color: '#ef4444' }}>FAILED</span>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>{campaignResult.totalFailed}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--border-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {validRowCount > 0 ? (
              <span>Ready to send to <strong>{validRowCount}</strong> recipient{validRowCount > 1 ? 's' : ''}</span>
            ) : (
              <span>Complete validation to enable send</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              type="button"
              onClick={onClose} 
              className="btn-secondary"
              disabled={isSending}
            >
              Close
            </button>
            <button 
              type="button"
              onClick={handleSend} 
              className="btn-primary"
              disabled={
                isSending || 
                !selectedTemplate || 
                !csvFile || 
                validationErrors.length > 0 || 
                (mediaHeaderFormat && !mediaFile)
              }
              style={{
                padding: '9px 20px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isSending ? (
                <>
                  <Loader size={15} className="spin" />
                  <span>Sending Batch...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send WhatsApp Batch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkTemplateSenderModal;
