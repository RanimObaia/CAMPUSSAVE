// Mode sombre : le lien actif / survolé du menu doit rester lisible (contraste >= 4,5:1).
// Langue : seules les langues complètes sont proposées et le choix reste après rechargement.
import { test, expect } from '@playwright/test'
import { COMPTES, seConnecter } from './utils.js'

const luminance = ([r, g, b]) => {
  const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contraste = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

// Couleurs calculées du lien (texte) et du premier fond non transparent
async function couleurs(lien) {
  return lien.evaluate((el) => {
    const nombres = (s) => (s.match(/[\d.]+/g) || []).map(Number)
    const texte = nombres(getComputedStyle(el).color).slice(0, 3)
    let n = el, fond = null
    while (n && !fond) {
      const v = nombres(getComputedStyle(n).backgroundColor)
      if (v.length >= 3 && (v.length === 3 || v[3] > 0.9)) fond = v.slice(0, 3)
      n = n.parentElement
    }
    return { texte, fond: fond || [18, 26, 22] }
  })
}

async function passerEnSombre(page) {
  await page.addInitScript(() => localStorage.setItem('campussave-theme', 'sombre'))
}

const ESPACES = [
  ['étudiant', COMPTES.etudiant, '.et-nav a.active'],
  ['commerçant', COMPTES.commercant, '.cs-nav a.active'],
  ['administrateur', COMPTES.admin, '.cs-nav a.active'],
]

test.describe('Mode sombre : menu lisible', () => {
  for (const [nom, email, selecteur] of ESPACES) {
    test(`${nom} : l'onglet actif est contrasté`, async ({ page }) => {
      await passerEnSombre(page)
      await seConnecter(page, email)
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre')
      const actif = page.locator(selecteur).first()
      await expect(actif).toBeVisible()
      const { texte, fond } = await couleurs(actif)
      expect(contraste(texte, fond)).toBeGreaterThanOrEqual(4.5)
    })
  }

  test('menu public : onglet actif et survol contrastés', async ({ page }) => {
    await passerEnSombre(page)
    await page.goto('/aide')
    const actif = page.locator('.pub-nav a.active').first()
    if (await actif.count()) {
      const { texte, fond } = await couleurs(actif)
      expect(contraste(texte, fond)).toBeGreaterThanOrEqual(4.5)
    }
    const lien = page.locator('.pub-nav a:not(.active)').first()
    await lien.hover()
    const { texte, fond } = await couleurs(lien)
    expect(contraste(texte, fond)).toBeGreaterThanOrEqual(4.5)
  })
})

test.describe('Langue', () => {
  test('seul le français est proposé tant que les autres langues sont incomplètes', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.reglages-langue')).toHaveCount(0)
  })

  test('une ancienne langue enregistrée (arabe) retombe sur le français, sans passer en droite à gauche', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('campussave-langue', 'ar'))
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  })

  test('le thème choisi est gardé au rechargement', async ({ page }) => {
    await page.goto('/')
    await page.locator('.reglages-theme').first().click()
    const choisi = await page.locator('html').getAttribute('data-theme')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', choisi)
  })
})
