// Mode démo seulement : reproduit les deux e-mails envoyés par le backend
// (backend/src/services/email.js) pour les montrer sur la page de retour de paiement.
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { dt, dateHeure } from './format'
import { heure } from './categories'

const echapper = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const cadre = (couleur, titre, sous, corps) => `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:16px;background:#f3ede1">
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17301a">
  <div style="background:${couleur};color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
    <h1 style="margin:0;font-size:22px">${titre}</h1><p style="margin:6px 0 0;opacity:.85">${sous}</p>
  </div>
  <div style="background:#fff;border:1px solid #dde5d6;border-top:0;padding:24px;border-radius:0 0 12px 12px">${corps}</div>
</div></body>`

export function emailConfirmation(c) {
  const lignes = c.lignes.map((l) => `<tr><td style="padding:8px;border-bottom:1px solid #dde5d6">${echapper(l.titre)}</td><td style="padding:8px;border-bottom:1px solid #dde5d6;text-align:center">${l.quantite}</td><td style="padding:8px;border-bottom:1px solid #dde5d6;text-align:right">${dt(l.prixUnitaire * l.quantite)}</td></tr>`).join('')
  const qr = renderToStaticMarkup(createElement(QRCodeSVG, { value: c.code, size: 180, level: 'M' }))
  return cadre('#17301a', 'Paiement confirmé ✓', "Merci d'avoir sauvé un repas avec CampusSave.", `
    <p>Commande <b>${echapper(c.code)}</b>, payée le ${dateHeure(c.paiement?.datePaiement)}.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f6f8f3"><th style="padding:8px;text-align:left">Produit</th><th style="padding:8px">Quantité</th><th style="padding:8px;text-align:right">Prix</th></tr>
      ${lignes}
      <tr><td colspan="2" style="padding:10px 8px;font-weight:bold">Total payé</td><td style="padding:10px 8px;text-align:right;font-weight:bold">${dt(c.montantTotal)}</td></tr>
    </table>
    <p style="margin-top:16px"><b>Retrait :</b> ${echapper(c.commerce?.nom)}, ${echapper(c.commerce?.adresse)}<br>${c.heureDebutRecuperation ? `de ${heure(c.heureDebutRecuperation)} à ${heure(c.heureFinRecuperation)}` : ''}</p>
    <p><b>Référence du paiement :</b> ${echapper(c.paiement?.reference)}</p>
    <p style="text-align:center;margin:24px 0 8px">Présente ce QR code au commerçant :</p>
    <p style="text-align:center">${qr}</p>
    <p style="text-align:center;font-family:monospace;font-size:18px;letter-spacing:2px">${echapper(c.code)}</p>`)
}

export function emailEchec(c) {
  const lignes = c.lignes.map((l) => `<li>${l.quantite} × ${echapper(l.titre)}</li>`).join('')
  return cadre('#b5432a', 'Paiement non abouti ✕', "Aucun montant n'a été débité.", `
    <p>Commande <b>${echapper(c.code)}</b> chez <b>${echapper(c.commerce?.nom)}</b> : ${dt(c.montantTotal)}.</p>
    <p>Le paiement n'a pas été accepté (carte refusée, paiement annulé ou abandonné).</p>
    <ul>${lignes}</ul>
    ${c.paiement?.reference ? `<p><b>Référence du paiement :</b> ${echapper(c.paiement.reference)}</p>` : ''}
    <p>La commande est annulée. Si l'offre est encore disponible, tu peux la commander à nouveau.</p>
    <p style="text-align:center;margin-top:24px"><span style="background:#1c6a4b;color:#fff;padding:12px 20px;border-radius:999px;font-weight:bold">Voir les offres</span></p>`)
}
