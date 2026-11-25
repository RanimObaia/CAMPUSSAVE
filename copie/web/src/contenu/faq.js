// Questions fréquentes (page Aide et accueil), en trois langues.
// Groupes : etudiant, paiement, commercant.
export const FAQ = {
  fr: [
    { g: 'etudiant', q: 'Qu\'est-ce qu\'une offre CampusSave ?', r: 'Des produits du jour qu\'un commerce n\'a pas vendus (plats, viennoiseries, pâtisseries, boissons), proposés à au moins 30 % de réduction. Tu vois le contenu, le prix et le créneau de retrait avant de réserver.' },
    { g: 'etudiant', q: 'Comment réserver ?', r: 'Ajoute une ou plusieurs offres d\'un même commerce au panier, puis clique sur « Commander et payer ». Tu es redirigé vers la page de paiement sécurisée Konnect.' },
    { g: 'etudiant', q: 'Comment récupérer ma commande ?', r: 'Va au commerce pendant le créneau indiqué, ouvre ta commande et touche « Afficher au comptoir » : ton QR code s\'affiche en grand. Le commerçant le scanne et c\'est fini.' },
    { g: 'etudiant', q: 'Un ami peut-il récupérer ma commande ?', r: 'Oui. Dans ta commande, choisis « Confier à un ami » : tu obtiens un lien à lui envoyer. Il y verra le QR code à présenter. Tu peux annuler ce lien à tout moment.' },
    { g: 'etudiant', q: 'Comment être prévenu des nouvelles offres ?', r: 'Ajoute tes commerces préférés en favoris (cœur). Dès qu\'ils publient une offre, tu reçois une notification. Tu reçois aussi un rappel 30 minutes avant ton retrait.' },
    { g: 'paiement', q: 'Quels moyens de paiement sont acceptés ?', r: 'Carte bancaire, e-DINAR et portefeuille Konnect. Le paiement est traité par Konnect : CampusSave ne voit jamais ton numéro de carte.' },
    { g: 'paiement', q: 'Je n\'ai pas reçu d\'e-mail de confirmation', r: 'Vérifie le dossier Spam. Ta commande et son QR code restent disponibles dans « Mes commandes ». Si le paiement apparaît « en attente », il est vérifié automatiquement auprès de Konnect.' },
    { g: 'paiement', q: 'Mon paiement a été refusé, suis-je débité ?', r: 'Non. Si le paiement échoue ou n\'est pas terminé dans les 30 minutes, la commande est annulée, rien n\'est débité et tu reçois un e-mail « paiement non abouti ». Les produits sont remis en vente.' },
    { g: 'paiement', q: 'Puis-je annuler une commande payée ?', r: 'Une commande payée réserve des produits pour toi. En cas de problème (commerce fermé, produit de mauvaise qualité), signale-le depuis ta commande : l\'équipe étudie chaque demande et peut te rembourser.' },
    { g: 'commercant', q: 'Combien coûte l\'inscription ?', r: 'Elle est gratuite. Créez un compte commerçant, renseignez votre commerce, puis l\'équipe le valide avant la première publication.' },
    { g: 'commercant', q: 'Comment publier une offre ?', r: 'Dans « Mes offres », cliquez sur « Publier une offre » : titre, prix initial et réduit, quantité et créneau de retrait. Cochez « Republier chaque jour » pour une offre récurrente.' },
    { g: 'commercant', q: 'Comment valider un retrait ?', r: 'Ouvrez « Valider un retrait » et scannez ou saisissez le code de l\'étudiant. Le système refuse un code déjà utilisé ou non payé.' },
  ],
  ar: [
    { g: 'etudiant', q: 'ما هو عرض CampusSave؟', r: 'منتجات اليوم التي لم يبعها المحل (أطباق، معجنات، حلويات، مشروبات) بتخفيض لا يقل عن 30٪. ترى المحتوى والسعر ووقت الاستلام قبل الحجز.' },
    { g: 'etudiant', q: 'كيف أحجز؟', r: 'أضف عرضاً أو أكثر من نفس المحل إلى السلة ثم اضغط «اطلب وادفع». ستنتقل إلى صفحة الدفع الآمنة Konnect.' },
    { g: 'etudiant', q: 'كيف أستلم طلبي؟', r: 'اذهب إلى المحل خلال الوقت المحدد وافتح طلبك واضغط «عرض عند الشباك»: يظهر رمز QR بحجم كبير ويقوم التاجر بمسحه.' },
    { g: 'etudiant', q: 'هل يمكن لصديق أن يستلم طلبي؟', r: 'نعم. اختر «إسناد إلى صديق» داخل طلبك لتحصل على رابط ترسله له. يمكنك إلغاء الرابط في أي وقت.' },
    { g: 'etudiant', q: 'كيف أعرف بالعروض الجديدة؟', r: 'أضف محلاتك المفضلة (القلب) وستصلك إشعارات عند نشرها عرضاً جديداً، وتذكير قبل 30 دقيقة من الاستلام.' },
    { g: 'paiement', q: 'ما هي وسائل الدفع؟', r: 'البطاقة البنكية وe-DINAR ومحفظة Konnect. الدفع تعالجه Konnect ولا يرى CampusSave رقم بطاقتك.' },
    { g: 'paiement', q: 'لم يصلني بريد التأكيد', r: 'تفقد مجلد الرسائل غير المرغوب فيها. طلبك ورمز QR متوفران دائماً في «طلباتي».' },
    { g: 'paiement', q: 'رُفض الدفع، هل تم الخصم؟', r: 'لا. إذا فشل الدفع أو لم يكتمل خلال 30 دقيقة يُلغى الطلب ولا يتم أي خصم وتصلك رسالة «الدفع لم يكتمل».' },
    { g: 'paiement', q: 'هل يمكن إلغاء طلب مدفوع؟', r: 'في حال وجود مشكلة (محل مغلق، جودة سيئة) أبلغ عنها من طلبك، ويدرس الفريق كل طلب ويمكنه استرجاع المبلغ.' },
    { g: 'commercant', q: 'كم يكلف التسجيل؟', r: 'التسجيل مجاني. أنشئ حساب تاجر وسجّل محلك، ثم يتحقق الفريق منه قبل أول نشر.' },
    { g: 'commercant', q: 'كيف أنشر عرضاً؟', r: 'في «عروضي» اضغط «نشر عرض»: العنوان والسعر الأصلي والمخفض والكمية ووقت الاستلام. اختر «إعادة النشر يومياً» لعرض متكرر.' },
    { g: 'commercant', q: 'كيف أؤكد الاستلام؟', r: 'افتح «تأكيد الاستلام» وامسح أو اكتب رمز الطالب.' },
  ],
  en: [
    { g: 'etudiant', q: 'What is a CampusSave offer?', r: 'Food a shop did not sell today (meals, pastries, cakes, drinks), offered at least 30% off. You see the content, price and pickup window before reserving.' },
    { g: 'etudiant', q: 'How do I reserve?', r: 'Add one or more offers from the same shop to your basket, then click “Order and pay”. You are sent to Konnect\'s secure payment page.' },
    { g: 'etudiant', q: 'How do I collect my order?', r: 'Go to the shop during the pickup window, open your order and tap “Show at the counter”: your QR code appears full screen. The shop scans it.' },
    { g: 'etudiant', q: 'Can a friend collect my order?', r: 'Yes. In your order choose “Send to a friend” to get a link for them. You can cancel the link at any time.' },
    { g: 'etudiant', q: 'How do I hear about new offers?', r: 'Add your favourite shops (heart). You get a notification when they post an offer, and a reminder 30 minutes before pickup.' },
    { g: 'paiement', q: 'Which payment methods are accepted?', r: 'Bank card, e-DINAR and Konnect wallet. Payment is handled by Konnect: CampusSave never sees your card number.' },
    { g: 'paiement', q: 'I did not receive a confirmation e-mail', r: 'Check your spam folder. Your order and QR code are always in “My orders”.' },
    { g: 'paiement', q: 'My payment was declined, was I charged?', r: 'No. If payment fails or is not completed within 30 minutes, the order is cancelled, nothing is charged and you get a “payment not completed” e-mail.' },
    { g: 'paiement', q: 'Can I cancel a paid order?', r: 'If something goes wrong (shop closed, poor quality), report it from your order: the team reviews every request and can refund you.' },
    { g: 'commercant', q: 'How much does it cost?', r: 'Sign-up is free. Create a business account, fill in your shop, and the team approves it before your first offer.' },
    { g: 'commercant', q: 'How do I post an offer?', r: 'In “My offers”, click “Post an offer”: title, original and reduced price, quantity and pickup window. Tick “Repost every day” for a recurring offer.' },
    { g: 'commercant', q: 'How do I validate a pickup?', r: 'Open “Validate a pickup” and scan or type the student\'s code.' },
  ],
}

export const GROUPES_FAQ = {
  fr: { etudiant: 'Étudiants', paiement: 'Paiement et remboursement', commercant: 'Commerçants' },
  ar: { etudiant: 'الطلبة', paiement: 'الدفع والاسترجاع', commercant: 'التجار' },
  en: { etudiant: 'Students', paiement: 'Payment and refunds', commercant: 'Businesses' },
}
