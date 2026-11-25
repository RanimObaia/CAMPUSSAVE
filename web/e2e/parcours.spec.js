import { test, expect } from '@playwright/test'
import { COMPTES, seConnecter } from './utils.js'

test.describe('Étudiant : de l\'offre au QR code', () => {
  test('commande complète : offre, panier, paiement réussi, QR code', async ({ page }) => {
    await seConnecter(page, COMPTES.etudiant)
    await expect(page).toHaveURL(/\/offres/)

    // 1. ouvrir une offre et l'ajouter au panier (navigation dans le site, sans recharger)
    await page.locator('a[href^="/offres/"]').first().click()
    await expect(page.locator('h1')).toBeVisible()
    await page.getByRole('button', { name: /Ajouter au panier/ }).first().click()
    await expect(page.getByText('Ajouté au panier')).toBeVisible()

    // 2. panier puis paiement de test
    await page.getByRole('link', { name: 'Voir mon panier' }).click()
    await expect(page.getByRole('heading', { name: 'Mon panier' })).toBeVisible()
    await page.getByRole('button', { name: /Commander et payer/ }).click()
    await expect(page).toHaveURL(/\/paiement\/simulation\//)
    await page.locator('button.cs-btn.primary.et-large').click()

    // 3. page « Paiement réussi », puis le détail de la commande avec son QR code
    await expect(page.getByRole('heading', { name: 'Paiement réussi' })).toBeVisible({ timeout: 15_000 })
    await page.locator('a[href^="/commandes/"]').first().click()
    await expect(page.locator('.et-qr svg').first()).toBeVisible()
    await expect(page.locator('.et-qr-texte')).toContainText(/^CS-/)
  })

  test('paiement refusé : la commande n\'est pas payée', async ({ page }) => {
    await seConnecter(page, COMPTES.etudiant)
    await page.locator('a[href^="/offres/"]').first().click()
    await page.getByRole('button', { name: /Ajouter au panier/ }).first().click()
    await page.getByRole('link', { name: 'Voir mon panier' }).click()
    await page.getByRole('button', { name: /Commander et payer/ }).click()
    await expect(page).toHaveURL(/\/paiement\/simulation\//)
    await page.locator('button.cs-btn.danger.et-large').click()
    await expect(page.locator('.et-qr svg')).toHaveCount(0)
  })

  test('les pages de l\'espace étudiant s\'ouvrent', async ({ page }) => {
    await seConnecter(page, COMPTES.etudiant)
    for (const chemin of ['/commandes', '/favoris', '/notifications', '/parametres', '/tableau-de-bord']) {
      await page.locator(`a[href="${chemin}"]`).first().click()
      await expect(page).toHaveURL(new RegExp(chemin))
      await expect(page.getByRole('alert')).toHaveCount(0)
      await expect(page.locator('h1').first()).toBeVisible()
    }
  })
})

test.describe('Commerçant', () => {
  test('les pages de l\'espace commerçant s\'ouvrent', async ({ page }) => {
    await seConnecter(page, COMPTES.commercant)
    await expect(page).toHaveURL(/\/commercant/)
    for (const nom of ['Mes offres', 'Commandes', 'Statistiques', 'Valider un retrait', 'Mon commerce', 'Mon profil', 'Tableau de bord']) {
      await page.getByRole('link', { name: nom, exact: true }).first().click()
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(page.getByRole('alert')).toHaveCount(0)
    }
  })

  test('validation d\'un retrait : code valide, déjà utilisé, inconnu', async ({ page }) => {
    await seConnecter(page, COMPTES.commercant)
    await page.getByRole('link', { name: 'Valider un retrait', exact: true }).first().click()
    const champ = page.getByLabel('Ou saisissez le code de la commande')
    const valider = page.getByRole('button', { name: 'Valider le retrait' })

    await champ.fill('CS-2048')
    await valider.click()
    await expect(page.getByText(/CS-2048/).first()).toBeVisible()

    await champ.fill('CS-2048')
    await valider.click()
    await expect(page.getByText(/déjà/i).first()).toBeVisible()

    await champ.fill('CS-0000')
    await valider.click()
    await expect(page.getByText(/inconnu|invalide/i).first()).toBeVisible()
  })

  test('création d\'une offre', async ({ page }) => {
    await seConnecter(page, COMPTES.commercant)
    await page.getByRole('link', { name: 'Mes offres', exact: true }).first().click()
    await page.locator('a[href="/commercant/offres/nouvelle"]').first().click()
    await page.getByLabel('Titre').fill('Panier surprise test')
    await page.getByLabel('Quantité disponible').fill('5')
    await page.getByLabel('Prix initial (DT)').fill('12')
    await page.getByLabel('Prix réduit (DT)').fill('4')
    const demain = new Date(Date.now() + 86_400_000)
    const f = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    await page.getByLabel('Début du retrait').fill(f(new Date(demain.getTime())))
    await page.getByLabel('Fin du retrait').fill(f(new Date(demain.getTime() + 2 * 3_600_000)))
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(/\/commercant\/offres$/)
    await expect(page.getByText('Panier surprise test')).toBeVisible()
  })
})

test.describe('Administrateur', () => {
  test('le tableau de bord affiche des chiffres et des graphiques', async ({ page }) => {
    await seConnecter(page, COMPTES.admin)
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.locator('.camembert-svg, .admin-kpi, [class*="camembert"]').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('les pages de l\'espace administrateur s\'ouvrent', async ({ page }) => {
    await seConnecter(page, COMPTES.admin)
    for (const nom of ['Commerces', 'Utilisateurs', 'Signalements', 'Modération', 'Commandes et paiements', 'Vue globale']) {
      await page.getByRole('link', { name: nom, exact: true }).first().click()
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(page.getByRole('alert')).toHaveCount(0)
    }
  })

  test('suspendre puis réactiver un utilisateur', async ({ page }) => {
    await seConnecter(page, COMPTES.admin)
    await page.getByRole('link', { name: 'Utilisateurs', exact: true }).first().click()
    const suspendre = page.getByRole('button', { name: 'Suspendre' }).first()
    await suspendre.click()
    await expect(page.getByRole('button', { name: 'Réactiver' }).first()).toBeVisible()
  })
})

