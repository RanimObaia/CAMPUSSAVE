// Comptes de démonstration (mode démo : tout mot de passe est accepté sauf pour les comptes suspendus)
export const COMPTES = {
  etudiant: 'etudiant@demo.campussave.tn',
  commercant: 'layal@demo.campussave.tn',
  admin: 'admin@demo.campussave.tn',
  suspendu: 'suspendu@demo.campussave.tn',
}
export const MDP = 'Demo2026!'

export async function seConnecter(page, email, mdp = MDP) {
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail').fill(email)
  await page.getByLabel('Mot de passe').fill(mdp)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}
