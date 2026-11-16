/* ============================================================
   NEXA STUDIO — CONFIGURATION À COMPLÉTER AVANT MISE EN LIGNE
   Une seule source pour l'identité, les mentions légales et le formulaire.
   Tout champ laissé vide ('') s'affiche sur le site sous la forme
   « À fournir : … » (encadré pointillé) et est listé dans la console.
   Ne rien inventer : chaque valeur doit être réelle et vérifiable.
   ============================================================ */
window.NEXA_CONFIG = {
  /* Identité de l'entreprise */
  brand: 'Nexa Studio',   // nom commercial validé le 15/11/2026 (affiché en dur dans le logo, les titres et les mentions légales)
  founderName: '',        // ex. 'Prénom Nom' — la personne qui répond aux clients
  founderRole: '',        // ex. 'Designer & développeur web'
  founderBio: '',         // 2–3 phrases vraies sur votre parcours
  founderPhoto: '',       // chemin d'une photo réelle, ex. 'assets/portrait.webp' (sinon initiales)
  city: '',               // ex. 'Lyon' — ville d'exercice
  area: '',               // ex. 'Lyon et à distance partout en France'
  email: '',              // adresse de contact professionnelle
  phone: '',              // facultatif

  /* Mentions légales (LCEN) */
  legalName: '',          // dénomination ou nom de l'entrepreneur
  legalForm: '',          // ex. 'Entrepreneur individuel (micro-entreprise)', 'SASU au capital de … €'
  address: '',            // adresse du siège / domiciliation
  siret: '',              // 14 chiffres
  rcs: '',                // immatriculation RCS / RNE si applicable, sinon laisser vide
  vat: '',                // n° de TVA intracommunautaire, ou 'TVA non applicable, art. 293 B du CGI' si c'est votre cas
  publicationDirector: '',// directeur de la publication (souvent vous-même)
  host: '',               // hébergeur : nom, adresse, téléphone (dépend de l'hébergeur choisi)
  priceMention: '',       // ex. 'Prix HT' / 'Prix TTC' / 'TVA non applicable, art. 293 B du CGI'
  mediator: '',           // médiateur de la consommation (obligatoire si vous vendez à des particuliers)

  /* Formulaire de contact : deux services gratuits compatibles (voir ACTIVATION-CONTACT.md)
     Option A — Formspree : collez l'URL fournie, ex. 'https://formspree.io/f/abcdwxyz'
     Option B — Web3Forms : formEndpoint = 'https://api.web3forms.com/submit' ET formAccessKey = clé reçue par e-mail
     Puis faites un envoi test et vérifiez la réception.
     Tant que ce champ est vide, AUCUN message n'est envoyé et le site l'indique clairement. */
  formEndpoint: '',
  formAccessKey: '',      // uniquement pour Web3Forms (clé publique par conception, liée à votre e-mail de réception)
  responseDelay: ''       // ex. '48 h ouvrées' : à renseigner SEULEMENT si vous pouvez tenir ce délai ; vide = aucun délai affiché
};
