import { test, expect } from '@playwright/test'
import { COMPTES, seConnecter } from './utils.js'

test.describe('Connexion et droits d\'accès', () => {
  test('la page d\'accueil et les offres se consultent sans compte', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).not.toBeEmpty()
    await page.goto('/offres')
    await expect(page).toHaveURL(/\/offres/)
  })

  test.describe('Bouton « Installer l\'application »', () => {
    test.use({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', isMobile: false })

    test('sans application qui répond : retombe sur la page de l\'application avec QR code', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('link', { name: "Installer l'application" }).first().click()
      await expect(page).toHaveURL(/\/application$/)
      await expect(page.getByRole('heading', { name: 'CampusSave sur ton téléphone' })).toBeVisible()
      await expect(page.locator('.app-qr svg')).toBeVisible()
    })
  })

  test('sur Android, le lien ouvre l\'application et retombe sur /application si elle est absente', async ({ page }) => {
    await page.goto('/')
    const lien = await page.evaluate(async () => (await import('/src/components/ouvrirApplication.js')).lienOuvertureAndroid(location.origin))
    expect(lien).toContain('intent://ouvrir#Intent;scheme=campussave;package=tn.essect.campussave;')
    expect(lien).toContain(`S.browser_fallback_url=${encodeURIComponent(`${new URL(page.url()).origin}/application`)}`)
  })

  test('une page inconnue affiche la page 404', async ({ page }) => {
    await page.goto('/cette-page-nexiste-pas')
    await expect(page.getByText(/introuvable|404/i).first()).toBeVisible()
  })

  test('étudiant : connexion puis redirection vers les offres', async ({ page }) => {
    await seConnecter(page, COMPTES.etudiant)
    await expect(page).toHaveURL(/\/offres/)
  })

  test('commerçant : connexion puis espace commerçant', async ({ page }) => {
    await seConnecter(page, COMPTES.commercant)
    await expect(page).toHaveURL(/\/commercant/)
  })

  test('administrateur : connexion puis espace administrateur', async ({ page }) => {
    await seConnecter(page, COMPTES.admin)
    await expect(page).toHaveURL(/\/admin/)
  })

  test('compte suspendu : connexion refusée', async ({ page }) => {
    await seConnecter(page, COMPTES.suspendu)
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('un étudiant ne peut pas ouvrir l\'espace admin ni commerçant', async ({ page }) => {
    await seConnecter(page, COMPTES.etudiant)
    await expect(page).toHaveURL(/\/offres/)
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin$/)
    await page.goto('/commercant')
    await expect(page).not.toHaveURL(/\/commercant$/)
  })

  test('sans connexion, le panier renvoie vers la connexion', async ({ page }) => {
    await page.goto('/panier')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Inscription : mot de passe fort', () => {
  test('la liste des règles se coche et un mot de passe faible est refusé', async ({ page }) => {
    await page.goto('/inscription')
    await page.getByLabel('Mot de passe', { exact: true }).fill('abc')
    await expect(page.locator('.mdp-regles li.ok')).toHaveCount(1)
    await page.getByLabel('Mot de passe', { exact: true }).fill('Abcdef1!')
    await expect(page.locator('.mdp-regles li.ok')).toHaveCount(5)

    await page.getByLabel('Prénom').fill('Test')
    await page.getByLabel('Nom', { exact: true }).fill('Utilisateur')
    await page.getByLabel('Adresse e-mail').fill('test@exemple.tn')
    await page.getByLabel('Téléphone').fill('12345678')
    await page.getByLabel('Mot de passe', { exact: true }).fill('faible')
    await page.getByLabel('Confirmation').fill('faible')
    await page.getByRole('button', { name: "S'inscrire" }).click()
    await expect(page.getByRole('alert')).toContainText(/trop faible/i)
  })
})
