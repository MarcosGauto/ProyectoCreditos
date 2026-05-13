import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateQualificationPDF = async (qualificationData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });

    // Ruta temporal de salida
    const pdfPath = path.join(
      process.cwd(),
      "temp",
      `qualification_${Date.now()}.pdf`
    );

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // ==========================
    // ENCABEZADO
    // ==========================
    doc.fontSize(20).text("Informe de Calificación Crediticia", { align: "center" });
    doc.moveDown();

    // ==========================
    // DATOS PRINCIPALES
    // ==========================
    doc.fontSize(12).text(`CUIT: ${qualificationData.cuit}`);
    doc.text(`Razón social: ${qualificationData.companyName}`);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // ==========================
    // RESULTADOS FINANCIEROS
    // ==========================
    doc.fontSize(14).text("Resultados Financieros", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Score Final: ${qualificationData.score}`);
    doc.text(`Nivel de Riesgo: ${qualificationData.riskLevel}`);
    doc.text(`Limite Sugerido: $${qualificationData.suggestedLimit}`);
    doc.moveDown();

    // ==========================
    // DETALLES DEL CÁLCULO
    // ==========================
    doc.fontSize(14).text("Detalle Analítico", { underline: true });
    doc.moveDown(0.5);

    qualificationData.details.forEach((item) => {
      doc.fontSize(12).text(`• ${item.label}: ${item.value}`);
    });

    // Finalización
    doc.end();

    stream.on("finish", () => resolve(pdfPath));
    stream.on("error", reject);
  });
};
