import { test, expect } from '@playwright/test'
import { COMPTES, seConnecter } from './utils.js'

test.describe('Connexion et droits d\'accès', () => {
  test('la page d\'accueil et les offres se consultent sans compte', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).not.toBeEmpty()
    await page.goto('/offres')
    await expect(page).toHaveURL(/\/offres/)
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
