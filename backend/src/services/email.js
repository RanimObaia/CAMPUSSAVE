// Email de confirmation de paiement (besoin BF-12 du cahier des charges).
// Gmail + mot de passe d'application : MAIL_USER et MAIL_APP_PASSWORD dans .env.
// MAIL_COPIE (facultatif) reçoit une copie cachée, par exemple pour la démonstration.
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

let transporteur = null;

function transport() {
  if (transporteur) return transporteur;
  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) return null;
  transporteur = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_APP_PASSWORD },
  });
  return transporteur;
}

const dt = (millimes) => `${(millimes / 1000).toFixed(3).replace('.', ',')} DT`;
const versDate = (v) => (v?.toDate ? v.toDate() : new Date(v));
const dateHeure = (v) => versDate(v).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const heure = (v) => versDate(v).toLocaleTimeString('fr-FR', { timeZone: 'Africa/Tunis', hour: '2-digit', minute: '2-digit', hour12: false });
const echapper = (texte) => String(texte ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function contenuHtml(c) {
  const lignes = c.lignes.map((l) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #dde5d6">${echapper(l.titre)}</td>
      <td style="padding:8px;border-bottom:1px solid #dde5d6;text-align:center">${l.quantite}</td>
      <td style="padding:8px;border-bottom:1px solid #dde5d6;text-align:right">${dt(l.prixUnitaire * l.quantite)}</td>
    </tr>`).join('');
  const retrait = c.heureDebutRecuperation
    ? `de ${heure(c.heureDebutRecuperation)} à ${heure(c.heureFinRecuperation)}`
    : 'aux horaires du commerce';

  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17301a">
    <div style="background:#17301a;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:22px">Paiement confirmé ✓</h1>
      <p style="margin:6px 0 0;color:#d5e6d0">Merci d'avoir sauvé un repas avec CampusSave.</p>
    </div>
    <div style="background:#ffffff;border:1px solid #dde5d6;border-top:0;padding:24px;border-radius:0 0 12px 12px">
      <p>Commande <b>${echapper(c.code)}</b>, payée le ${dateHeure(c.paiement.datePaiement)}.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="background:#f6f8f3"><th style="padding:8px;text-align:left">Produit</th><th style="padding:8px">Quantité</th><th style="padding:8px;text-align:right">Prix</th></tr>
        ${lignes}
        <tr><td colspan="2" style="padding:10px 8px;font-weight:bold">Total payé</td><td style="padding:10px 8px;text-align:right;font-weight:bold">${dt(c.montantTotal)}</td></tr>
      </table>
      <p style="margin-top:16px"><b>Retrait :</b> ${echapper(c.commerce.nom)}, ${echapper(c.commerce.adresse)}<br>${retrait}</p>
      <p><b>Référence du paiement :</b> ${echapper(c.paiement.reference)}</p>
      <p style="text-align:center;margin:24px 0 8px">Présente ce QR code au commerçant :</p>
      <p style="text-align:center"><img src="cid:qrcode" alt="QR code ${echapper(c.code)}" width="180" height="180"></p>
      <p style="text-align:center;font-family:monospace;font-size:18px;letter-spacing:2px">${echapper(c.code)}</p>
    </div>
  </div>`;
}

// Renvoie true si l'email est parti, false sinon (le paiement reste valide dans tous les cas).
async function envoyerConfirmation(commande) {
  const t = transport();
  if (!t) {
    console.warn(`Email non envoyé pour ${commande.code} : MAIL_USER / MAIL_APP_PASSWORD manquants.`);
    return false;
  }
  try {
    await t.sendMail({
      from: `"CampusSave" <${process.env.MAIL_USER}>`,
      to: commande.emailEtudiant,
      bcc: process.env.MAIL_COPIE || undefined,
      subject: `CampusSave – Paiement confirmé, commande ${commande.code}`,
      html: contenuHtml(commande),
      attachments: [{ filename: `${commande.code}.png`, content: await QRCode.toBuffer(commande.code, { width: 360, margin: 1 }), cid: 'qrcode' }],
    });
    return true;
  } catch (err) {
    console.error(`Échec de l'email pour ${commande.code} :`, err.message);
    return false;
  }
}

// Pour les tests automatiques seulement
function remplacerTransportPourTests(t) {
  transporteur = t;
}

module.exports = { envoyerConfirmation, contenuHtml, remplacerTransportPourTests };
