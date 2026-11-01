import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ColumnMapping {
  name: string;
  sellPrice: string;
  costPrice: string;
  initialStock: string;
  sku: string;
  category: string;
  unit: string;
  minStock: string;
  barcode: string;
}

const TARGET_FIELDS = [
  { key: 'name', label: 'Nama Sparepart / Barang', required: true, hint: 'Wajib ada nama barang' },
  { key: 'sellPrice', label: 'Harga Jual Eceran', required: true, hint: 'Wajib untuk kasir' },
  { key: 'costPrice', label: 'Harga Beli (HPP)', required: false, hint: 'Modal beli dari supplier' },
  { key: 'initialStock', label: 'Stok Awal', required: false, hint: 'Jumlah fisik saat ini (default: 0)' },
  { key: 'sku', label: 'Kode SKU / Part Number', required: false, hint: 'Otomatis dibuat jika kosong' },
  { key: 'category', label: 'Kategori', required: false, hint: 'Default: Sparepart' },
  { key: 'unit', label: 'Satuan', required: false, hint: 'Default: Pcs' },
  { key: 'minStock', label: 'Minimal Stok', required: false, hint: 'Default: 5' },
  { key: 'barcode', label: 'Barcode', required: false, hint: 'Opsional (untuk scanner)' },
] as const;

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    sellPrice: '',
    costPrice: '',
    initialStock: '',
    sku: '',
    category: '',
    unit: '',
    minStock: '',
    barcode: '',
  });
  const [updateExisting, setUpdateExisting] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  // Smart heuristic auto-matcher
  const guessColumn = (headers: string[], aliases: string[]): string => {
    for (const header of headers) {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const alias of aliases) {
        if (normalized.includes(alias.toLowerCase())) {
          return header;
        }
      }
    }
    return '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Parse to array of objects with headers
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
        if (!data || data.length < 2) {
          showToast('error', 'File Excel kosong atau tidak memiliki baris data.');
          return;
        }

        const headers = (data[0] as any[])
          .map((h) => String(h || '').trim())
          .filter(Boolean);

        const rows = data.slice(1).map((row: any[]) => {
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            obj[h] = row[idx];
          });
          return obj;
        });

        setFileHeaders(headers);
        setRawRows(rows);

        // Auto guess mapping
        setMapping({
          name: guessColumn(headers, ['nama', 'name', 'item', 'barang', 'produk', 'deskripsi', 'part']),
          sellPrice: guessColumn(headers, ['jual', 'sell', 'eceran', 'retail', 'harga', 'price']),
          costPrice: guessColumn(headers, ['beli', 'cost', 'hpp', 'modal', 'kulakan']),
          initialStock: guessColumn(headers, ['stok', 'stock', 'qty', 'saldo', 'jumlah', 'kuantitas']),
          sku: guessColumn(headers, ['sku', 'kode', 'code', 'partnumber', 'partno']),
          category: guessColumn(headers, ['kategori', 'category', 'jenis', 'tipe', 'golongan']),
          unit: guessColumn(headers, ['satuan', 'unit', 'uom']),
          minStock: guessColumn(headers, ['min', 'minimum', 'minstok', 'minstock']),
          barcode: guessColumn(headers, ['barcode', 'upc', 'ean']),
        });
      } catch (err: any) {
        showToast('error', 'Gagal membaca file: ' + (err.message || 'Format tidak didukung'));
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'KODE BARANG': 'OLI-MPX1-08',
        'NAMA SPAREPART': 'Oli Mesin AHM MPX 1 0.8L (Bebek/Sport)',
        'KATEGORI': 'Oli Mesin',
        'SATUAN': 'Botol',
        'HARGA BELI (HPP)': 45000,
        'HARGA JUAL': 55000,
        'STOK AWAL': 24,
        'MIN STOK': 5,
        'BARCODE': '8991234567890',
      },
      {
        'KODE BARANG': 'BAN-TUB-01',
        'NAMA SPAREPART': 'Ban Luar Tubeless FDR 90/90-14 Genzi',
        'KATEGORI': 'Roda & Ban',
        'SATUAN': 'Pcs',
        'HARGA BELI (HPP)': 185000,
        'HARGA JUAL': 225000,
        'STOK AWAL': 6,
        'MIN STOK': 2,
        'BARCODE': '8999876543210',
      },
      {
        'KODE BARANG': 'KMP-REM-01',
        'NAMA SPAREPART': 'Kampas Rem Depan Honda Beat FI',
        'KATEGORI': 'Pengereman',
        'SATUAN': 'Set',
        'HARGA BELI (HPP)': 28000,
        'HARGA JUAL': 40000,
        'STOK AWAL': 15,
        'MIN STOK': 3,
        'BARCODE': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Sparepart');
    XLSX.writeFile(wb, 'Template_Katalog_Sparepart_BengkelOS.xlsx');
  };

  const parseNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    // Strip Currency prefix, commas, and dots
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleImportSubmit = async () => {
    if (!mapping.name) {
      showToast('error', 'Silakan pilih kolom untuk "Nama Sparepart / Barang"');
      return;
    }

    setLoading(true);
    try {
      const itemsToImport = rawRows
        .filter((row) => row[mapping.name] && String(row[mapping.name]).trim().length > 0)
        .map((row) => {
          return {
            name: String(row[mapping.name]).trim(),
            sku: mapping.sku && row[mapping.sku] ? String(row[mapping.sku]).trim() : undefined,
            barcode: mapping.barcode && row[mapping.barcode] ? String(row[mapping.barcode]).trim() : undefined,
            category: mapping.category && row[mapping.category] ? String(row[mapping.category]).trim() : 'Sparepart',
            unit: mapping.unit && row[mapping.unit] ? String(row[mapping.unit]).trim() : 'Pcs',
            costPrice: mapping.costPrice ? parseNumber(row[mapping.costPrice]) : 0,
            sellPrice: mapping.sellPrice ? parseNumber(row[mapping.sellPrice]) : 0,
            initialStock: mapping.initialStock ? Math.floor(parseNumber(row[mapping.initialStock])) : 0,
            minStock: mapping.minStock ? Math.floor(parseNumber(row[mapping.minStock])) : 5,
          };
        });

      if (itemsToImport.length === 0) {
        showToast('error', 'Tidak ada data produk yang valid untuk diimpor.');
        setLoading(false);
        return;
      }

      const res = await apiFetch<any>('/products/bulk-import', {
        method: 'POST',
        body: JSON.stringify({
          items: itemsToImport,
          updateExisting,
        }),
      });

      showToast('success', res.message || 'Import data suku cadang berhasil diselesaikan!');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memproses import data.');
    } finally {
      setLoading(false);
    }
  };

  const previewItems = rawRows.slice(0, 5).map((row, idx) => ({
    index: idx + 1,
    name: mapping.name ? row[mapping.name] : '-',
    sku: mapping.sku && row[mapping.sku] ? row[mapping.sku] : '(Auto SKU)',
    category: mapping.category && row[mapping.category] ? row[mapping.category] : 'Sparepart',
    costPrice: mapping.costPrice ? parseNumber(row[mapping.costPrice]) : 0,
    sellPrice: mapping.sellPrice ? parseNumber(row[mapping.sellPrice]) : 0,
    stock: mapping.initialStock ? parseNumber(row[mapping.initialStock]) : 0,
    unit: mapping.unit && row[mapping.unit] ? row[mapping.unit] : 'Pcs',
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-zinc-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-zinc-900">
                Import Suku Cadang & Stok dari Excel / CSV
              </h2>
              <p className="text-[11px] text-zinc-500">
                Pencocokan kolom otomatis (*Smart Column Mapping*) dari file apa pun.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Upload or Download Template */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="sm:col-span-2 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl p-4 text-center cursor-pointer transition bg-zinc-50/50 hover:bg-zinc-50 flex flex-col items-center justify-center"
            >
              <Upload className="w-6 h-6 text-zinc-400 mb-1.5" />
              <p className="text-xs font-semibold text-zinc-800">
                {fileName ? fileName : 'Klik untuk Unggah File Excel / CSV'}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Mendukung file .xlsx, .xls, atau .csv (maksimal 2.000 baris)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between bg-white text-left">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                  Opsi Bantuan
                </span>
                <p className="text-xs font-semibold text-zinc-800 mt-1">
                  Belum punya format?
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                  Gunakan template resmi kami yang siap diisi.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span>Unduh Template</span>
              </button>
            </div>
          </div>

          {/* Step 2: Mapping Section (If file loaded) */}
          {fileHeaders.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                    <span>Pencocokan Kolom (Smart Mapping)</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium border border-emerald-200">
                      {rawRows.length} Baris Terdeteksi
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Cocokkan kolom di file Anda dengan data di sistem BengkelOS.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                {TARGET_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <label className="font-semibold text-zinc-800">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <span className="text-[10px] text-zinc-400">{field.hint}</span>
                    </div>
                    <select
                      value={(mapping as any)[field.key]}
                      onChange={(e) =>
                        setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none font-medium transition ${
                        (mapping as any)[field.key]
                          ? 'bg-white border-zinc-300 text-zinc-900'
                          : field.required
                          ? 'bg-rose-50/50 border-rose-200 text-rose-700'
                          : 'bg-zinc-100/70 border-zinc-200 text-zinc-400'
                      }`}
                    >
                      <option value="">-- Lewati / Kosongkan --</option>
                      {fileHeaders.map((header) => (
                        <option key={header} value={header}>
                          Kolom di Excel: &quot;{header}&quot;
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Step 3: Live Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    Pratinjau Hasil Import (5 Baris Pertama)
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    Otomatis diperbarui saat memilih kolom
                  </span>
                </div>

                <div className="overflow-x-auto border border-zinc-200 rounded-xl bg-white">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 font-semibold text-[11px]">
                        <th className="py-2 px-3 text-center">#</th>
                        <th className="py-2 px-3">Kode SKU</th>
                        <th className="py-2 px-3">Nama Sparepart</th>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3 text-right">Harga Beli</th>
                        <th className="py-2 px-3 text-right">Harga Jual</th>
                        <th className="py-2 px-3 text-center">Stok Awal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-[11px]">
                      {previewItems.map((p) => (
                        <tr key={p.index} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-3 text-center text-zinc-400">{p.index}</td>
                          <td className="py-2 px-3 font-mono font-medium text-zinc-700">{p.sku}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">{p.name || '-'}</td>
                          <td className="py-2 px-3 text-zinc-600">{p.category}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-zinc-600">
                            Rp {p.costPrice.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold text-zinc-900">
                            Rp {p.sellPrice.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-800 tabular-nums">
                            {p.stock} {p.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Option: Update existing products if SKU matches */}
              <label className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-zinc-900">
                    Perbarui harga dan stok jika SKU sudah ada
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Jika tidak dicentang, produk dengan SKU yang sudah terdaftar akan dilewati (*skip*).
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={loading || rawRows.length === 0 || !mapping.name}
            onClick={handleImportSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-lg text-xs font-semibold shadow-subtle transition"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses {rawRows.length} Produk...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {rawRows.length > 0
                    ? `Konfirmasi Simpan ${rawRows.length} Produk`
                    : 'Pilih File Terlebih Dahulu'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
