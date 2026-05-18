// The standalone bundle has no bundled types; reuse @types/pdfkit's declaration.
declare module 'pdfkit/js/pdfkit.standalone' {
  import PDFDocument from 'pdfkit';
  export default PDFDocument;
}
