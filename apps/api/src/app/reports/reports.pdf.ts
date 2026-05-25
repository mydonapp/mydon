// Use pdfkit's standalone build: it inlines the AFM font metrics, so it works in
// the webpack-bundled Node process where the loose `data/*.afm` files aren't on
// disk (the plain `pdfkit` entry reads them via fs at runtime and ENOENTs).
import PDFDocument from 'pdfkit/js/pdfkit.standalone';

interface Meta {
  ledgerName: string;
  baseCurrency: string;
  periodLabel: string;
}

interface TrialBalanceData {
  rows: { code: string; name: string; debit: number; credit: number }[];
  debitTotal: number;
  creditTotal: number;
  difference: number;
  balanced: boolean;
}

interface BalanceSheetSection {
  accounts: { code: string; name: string; amount: number }[];
  total: number;
}

interface BalanceSheetData {
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  netResult: number;
  priorPeriodResult: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
}

interface IncomeStatementRow {
  code: string;
  name: string;
  current: number;
  previous: number;
}

interface IncomeStatementData {
  income: { rows: IncomeStatementRow[]; currentTotal: number; previousTotal: number };
  expense: { rows: IncomeStatementRow[]; currentTotal: number; previousTotal: number };
  netResult: { current: number; previous: number };
  currentLabel: string | null;
  previousLabel: string | null;
}

const MARGIN = 50;
const ROW_H = 18;

function money(value: number, currency: string): string {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(value);
}

function collect(doc: PDFKit.PDFDocument): Promise<Buffer> {
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function header(doc: PDFKit.PDFDocument, meta: Meta, title: string): void {
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#111111').text(meta.ledgerName, MARGIN, MARGIN);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#333333').text(title, { continued: false });
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9).fillColor('#666666');
  doc.text(`Period: ${meta.periodLabel}`);
  doc.text(`Amounts in ${meta.baseCurrency}`);
  doc.text(`Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  doc.moveDown(0.6);
  const y = doc.y;
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(MARGIN, y)
    .lineTo(doc.page.width - MARGIN, y)
    .stroke();
  doc.moveDown(0.8);
}

function footer(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#999999')
      .text(`myDon — page ${i + 1} of ${range.count}`, MARGIN, doc.page.height - MARGIN + 10, {
        width: doc.page.width - MARGIN * 2,
        align: 'center',
      });
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number, onNewPage: () => void): void {
  if (doc.y + needed > doc.page.height - MARGIN) {
    doc.addPage();
    onNewPage();
  }
}

export function buildTrialBalancePdf(meta: Meta, data: TrialBalanceData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
  const done = collect(doc);

  const cols = {
    code: { x: MARGIN, w: 70 },
    name: { x: MARGIN + 70, w: 235 },
    debit: { x: MARGIN + 305, w: 90 },
    credit: { x: MARGIN + 395, w: doc.page.width - MARGIN - (MARGIN + 395) },
  };

  const columnHeader = () => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333');
    const y = doc.y;
    doc.text('Code', cols.code.x, y, { width: cols.code.w });
    doc.text('Account', cols.name.x, y, { width: cols.name.w });
    doc.text('Debit', cols.debit.x, y, { width: cols.debit.w, align: 'right' });
    doc.text('Credit', cols.credit.x, y, { width: cols.credit.w, align: 'right' });
    doc.moveDown(0.5);
    doc
      .strokeColor('#dddddd')
      .lineWidth(0.5)
      .moveTo(MARGIN, doc.y)
      .lineTo(doc.page.width - MARGIN, doc.y)
      .stroke();
    doc.moveDown(0.3);
  };

  header(doc, meta, 'Trial Balance');
  columnHeader();

  doc.font('Helvetica').fontSize(9).fillColor('#111111');
  for (const row of data.rows) {
    ensureSpace(doc, ROW_H, () => {
      header(doc, meta, 'Trial Balance');
      columnHeader();
      doc.font('Helvetica').fontSize(9).fillColor('#111111');
    });
    const y = doc.y;
    doc.text(row.code || '—', cols.code.x, y, { width: cols.code.w, lineBreak: false });
    doc.text(row.name, cols.name.x, y, { width: cols.name.w, lineBreak: false, ellipsis: true });
    doc.text(row.debit ? money(row.debit, meta.baseCurrency) : '', cols.debit.x, y, {
      width: cols.debit.w,
      align: 'right',
    });
    doc.text(row.credit ? money(row.credit, meta.baseCurrency) : '', cols.credit.x, y, {
      width: cols.credit.w,
      align: 'right',
    });
    doc.y = y + ROW_H;
  }

  doc
    .strokeColor('#333333')
    .lineWidth(1)
    .moveTo(MARGIN, doc.y)
    .lineTo(doc.page.width - MARGIN, doc.y)
    .stroke();
  doc.moveDown(0.3);
  const ty = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#111111');
  doc.text('Total', cols.name.x, ty, { width: cols.name.w });
  doc.text(money(data.debitTotal, meta.baseCurrency), cols.debit.x, ty, { width: cols.debit.w, align: 'right' });
  doc.text(money(data.creditTotal, meta.baseCurrency), cols.credit.x, ty, { width: cols.credit.w, align: 'right' });
  doc.y = ty + ROW_H;

  doc.moveDown(0.6);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(data.balanced ? '#15803d' : '#b45309')
    .text(
      data.balanced
        ? 'The ledger is balanced.'
        : `The ledger is NOT balanced. Difference: ${money(data.difference, meta.baseCurrency)}`,
      MARGIN,
      doc.y,
    );

  footer(doc);
  doc.end();
  return done;
}

export function buildIncomeStatementPdf(meta: Meta, data: IncomeStatementData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
  const done = collect(doc);

  const cols = {
    name: { x: MARGIN, w: 255 },
    current: { x: MARGIN + 255, w: 120 },
    previous: { x: MARGIN + 375, w: doc.page.width - MARGIN - (MARGIN + 375) },
  };
  const cur = data.currentLabel ?? 'Current';
  const prev = data.previousLabel ?? 'Previous';
  const named = (code: string, name: string) => (code ? `${code}  ${name}` : name);

  const columnHeader = () => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333');
    const y = doc.y;
    doc.text('Account', cols.name.x, y, { width: cols.name.w });
    doc.text(cur, cols.current.x, y, { width: cols.current.w, align: 'right' });
    doc.text(prev, cols.previous.x, y, { width: cols.previous.w, align: 'right' });
    doc.moveDown(0.5);
    doc
      .strokeColor('#dddddd')
      .lineWidth(0.5)
      .moveTo(MARGIN, doc.y)
      .lineTo(doc.page.width - MARGIN, doc.y)
      .stroke();
    doc.moveDown(0.3);
  };

  const line = (label: string, current: number, previous: number, bold = false) => {
    ensureSpace(doc, ROW_H, () => {
      header(doc, meta, 'Income Statement');
      columnHeader();
    });
    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .fillColor('#111111');
    const y = doc.y;
    doc.text(label, cols.name.x, y, { width: cols.name.w, lineBreak: false, ellipsis: true });
    doc.text(money(current, meta.baseCurrency), cols.current.x, y, { width: cols.current.w, align: 'right' });
    doc.text(money(previous, meta.baseCurrency), cols.previous.x, y, { width: cols.previous.w, align: 'right' });
    doc.y = y + ROW_H;
  };

  const sectionLabel = (title: string) => {
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text(title, MARGIN, doc.y);
    doc.moveDown(0.2);
  };

  header(doc, meta, 'Income Statement');
  columnHeader();

  sectionLabel('Revenue');
  for (const r of data.income.rows) {
    line(named(r.code, r.name), r.current, r.previous);
  }
  line('Total revenue', data.income.currentTotal, data.income.previousTotal, true);

  sectionLabel('Expenses');
  for (const r of data.expense.rows) {
    line(named(r.code, r.name), r.current, r.previous);
  }
  line('Total expenses', data.expense.currentTotal, data.expense.previousTotal, true);

  doc.moveDown(0.3);
  doc
    .strokeColor('#333333')
    .lineWidth(1)
    .moveTo(MARGIN, doc.y)
    .lineTo(doc.page.width - MARGIN, doc.y)
    .stroke();
  doc.moveDown(0.3);
  line('Net result', data.netResult.current, data.netResult.previous, true);

  footer(doc);
  doc.end();
  return done;
}

export function buildBalanceSheetPdf(meta: Meta, data: BalanceSheetData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
  const done = collect(doc);

  const contentW = doc.page.width - MARGIN * 2;
  const colGap = 24;
  const colW = (contentW - colGap) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colW + colGap;
  const amountW = 95;

  const sectionTitle = (x: number, y: number, title: string): number => {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333').text(title, x, y, { width: colW });
    const ny = y + 16;
    doc
      .strokeColor('#dddddd')
      .lineWidth(0.5)
      .moveTo(x, ny)
      .lineTo(x + colW, ny)
      .stroke();
    return ny + 6;
  };

  const row = (x: number, y: number, label: string, amount: number, bold = false): number => {
    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .fillColor('#111111');
    doc.text(label, x, y, { width: colW - amountW - 8, lineBreak: false, ellipsis: true });
    doc.text(money(amount, meta.baseCurrency), x + colW - amountW, y, { width: amountW, align: 'right' });
    return y + ROW_H;
  };

  const totalRow = (x: number, y: number, label: string, amount: number): number => {
    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(x, y - 2)
      .lineTo(x + colW, y - 2)
      .stroke();
    return row(x, y, label, amount, true);
  };

  const named = (code: string, name: string) => (code ? `${code}  ${name}` : name);

  header(doc, meta, 'Balance Sheet');
  const topY = doc.y;

  // Left column — Assets
  let ly = sectionTitle(leftX, topY, 'Assets');
  for (const a of data.assets.accounts) {
    ly = row(leftX, ly, named(a.code, a.name), a.amount);
  }
  ly = totalRow(leftX, ly, 'Total Assets', data.assets.total);

  // Right column — Liabilities, then Equity
  let ry = sectionTitle(rightX, topY, 'Liabilities');
  for (const a of data.liabilities.accounts) {
    ry = row(rightX, ry, named(a.code, a.name), a.amount);
  }
  ry = totalRow(rightX, ry, 'Total Liabilities', data.liabilities.total);
  ry += 10;
  ry = sectionTitle(rightX, ry, 'Equity');
  for (const a of data.equity.accounts) {
    ry = row(rightX, ry, named(a.code, a.name), a.amount);
  }
  if (Math.abs(data.priorPeriodResult) > 0.005) {
    ry = row(rightX, ry, 'Retained earnings (prior periods)', data.priorPeriodResult);
  }
  ry = row(rightX, ry, 'Net result (period)', data.netResult);
  ry = totalRow(rightX, ry, 'Total Equity', data.totalEquity);
  ry += 10;
  ry = totalRow(rightX, ry, 'Total Liabilities + Equity', data.totalLiabilitiesAndEquity);

  doc.y = Math.max(ly, ry) + 24;
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(data.balanced ? '#15803d' : '#b45309')
    .text(
      data.balanced
        ? 'Assets = Liabilities + Equity. The balance sheet is balanced.'
        : 'The balance sheet is NOT balanced.',
      MARGIN,
      doc.y,
      { width: contentW },
    );

  footer(doc);
  doc.end();
  return done;
}
