export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';

    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.';

    case 'auth/too-many-requests':
      return 'Trop de tentatives. Veuillez réessayer plus tard.';

    case 'auth/network-request-failed':
      return 'Pas de connexion Internet.';

    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    
    case 'auth/email-already-in-use':
        return 'Cet email est déjà utilisé.';
    case 'auth/invalid-email':
        return 'Adresse email invalide.';
    case 'auth/weak-password':
        return 'Le mot de passe est trop faible.';
    case 'auth/operation-not-allowed':
        return 'L\'inscription n\'est pas autorisée.';

    default:
      return 'Une erreur est survenue. Veuillez réessayer.';
  }
}