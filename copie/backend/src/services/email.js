// Emails de paiement (besoin BF-12 du cahier des charges) : confirmation et refus.
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

// E-mail de paiement refusé ou expiré (aucun montant débité, stock remis en vente).
// motif : 'REFUSE' (paiement refusé ou abandonné sur Konnect) ou 'EXPIRE' (lien de 30 min dépassé).
function contenuEchecHtml(c, motif) {
  const raison = motif === 'EXPIRE'
    ? "Le délai de paiement de 30 minutes est dépassé : la réservation a été libérée."
    : "Le paiement n'a pas été accepté (carte refusée, paiement annulé ou abandonné).";
  const lignes = c.lignes.map((l) => `<li>${l.quantite} × ${echapper(l.titre)}</li>`).join('');
  const web = process.env.WEB_APP_URL || 'http://localhost:5173';
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17301a">
    <div style="background:#b5432a;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:22px">Paiement non abouti ✕</h1>
      <p style="margin:6px 0 0;color:#f6e1d9">Aucun montant n'a été débité.</p>
    </div>
    <div style="background:#ffffff;border:1px solid #dde5d6;border-top:0;padding:24px;border-radius:0 0 12px 12px">
      <p>Commande <b>${echapper(c.code)}</b> chez <b>${echapper(c.commerce?.nom)}</b> : ${dt(c.montantTotal)}.</p>
      <p>${raison}</p>
      <ul>${lignes}</ul>
      ${c.paiement?.reference ? `<p><b>Référence du paiement :</b> ${echapper(c.paiement.reference)}</p>` : ''}
      <p>La commande est annulée. Si l'offre est encore disponible, tu peux la commander à nouveau.</p>
      <p style="text-align:center;margin-top:24px">
        <a href="${echapper(web)}/offres" style="background:#1c6a4b;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Voir les offres</a>
      </p>
      <p style="color:#5b6a60;font-size:13px">Un problème ? Réponds à cet e-mail ou écris-nous depuis la page Contact.</p>
    </div>
  </div>`;
}

// Envoi générique. Renvoie true si l'email est parti, false sinon (jamais d'erreur levée).
async function envoyer(message, etiquette) {
  const t = transport();
  if (!t) {
    console.warn(`Email non envoyé (${etiquette}) : MAIL_USER / MAIL_APP_PASSWORD manquants.`);
    return false;
  }
  if (!message.to) {
    console.warn(`Email non envoyé (${etiquette}) : destinataire inconnu.`);
    return false;
  }
  try {
    await t.sendMail({ from: `"CampusSave" <${process.env.MAIL_USER}>`, bcc: process.env.MAIL_COPIE || undefined, ...message });
    return true;
  } catch (err) {
    console.error(`Échec de l'email (${etiquette}) :`, err.message);
    return false;
  }
}

// Paiement réussi : récapitulatif + QR code en pièce jointe intégrée.
async function envoyerConfirmation(commande) {
  return envoyer({
    to: commande.emailEtudiant,
    subject: `CampusSave – Paiement confirmé, commande ${commande.code}`,
    html: contenuHtml(commande),
    attachments: [{ filename: `${commande.code}.png`, content: await QRCode.toBuffer(commande.code, { width: 360, margin: 1 }), cid: 'qrcode' }],
  }, commande.code);
}

// Paiement refusé ou expiré
async function envoyerEchec(commande, motif = 'REFUSE') {
  return envoyer({
    to: commande.emailEtudiant,
    subject: `CampusSave – Paiement non abouti, commande ${commande.code}`,
    html: contenuEchecHtml(commande, motif),
  }, `${commande.code} échec`);
}

// Message du formulaire de contact, transmis à l'équipe (MAIL_CONTACT, sinon MAIL_USER)
async function envoyerContact({ nom, email, sujet, message }) {
  return envoyer({
    to: process.env.MAIL_CONTACT || process.env.MAIL_USER,
    replyTo: email,
    subject: `CampusSave – Contact : ${sujet}`,
    html: `<p><b>${echapper(nom)}</b> (${echapper(email)}) a écrit :</p><p style="white-space:pre-wrap">${echapper(message)}</p>`,
  }, 'contact');
}

// Pour les tests automatiques seulement
function remplacerTransportPourTests(t) {
  transporteur = t;
}

module.exports = { envoyerConfirmation, envoyerEchec, envoyerContact, contenuHtml, contenuEchecHtml, remplacerTransportPourTests };
