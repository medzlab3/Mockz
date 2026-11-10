/**
 * Generates an elegant sample 4-page invitation card in high resolution
 */
export function generateSampleInvitationPages(): string[] {
  const width = 1200;
  const height = 1696; // A-ratio proportion
  const pages: string[] = [];

  // Helper to create a canvas
  const createBaseCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  };

  // 1. Couverture Avant (Page 1)
  {
    const { canvas, ctx } = createBaseCanvas();
    // Background deep luxury dark obsidian with warm gold undertone
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#17150e');
    grad.addColorStop(1, '#0d0b07');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Double Gold Frame
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, width - 120, height - 120);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(76, 76, width - 152, height - 152);

    // Gold monogram / emblem
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(width / 2, 420, 80, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d4af37';
    ctx.stroke();

    ctx.font = 'italic 56px "Didot", "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', width / 2, 420);

    // Subtitle
    ctx.font = '300 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('SOIRÉE DE GALA 2026', width / 2, 600);

    // Main Title
    ctx.font = '600 78px "Didot", "Playfair Display", Georgia, serif';
    ctx.letterSpacing = '4px';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText("L'ÉLÉGANCE", width / 2, 740);

    // Date & Place
    ctx.font = '400 28px "Didot", Georgia, serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('SAMEDI 14 NOVEMBRE 2026', width / 2, 920);

    ctx.font = '300 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PAVILLON GABRIEL • PARIS', width / 2, 980);

    pages.push(canvas.toDataURL('image/jpeg', 0.94));
  }

  // 2. Intérieur Gauche (Page 2)
  {
    const { canvas, ctx } = createBaseCanvas();
    // Warm off-white luxury background
    ctx.fillStyle = '#fcfbfa';
    ctx.fillRect(0, 0, width, height);

    // Subtle framing
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 80, width - 160, height - 160);

    // Header
    ctx.font = 'italic 44px "Didot", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('Programme de la Soirée', width / 2, 340);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 80, 390);
    ctx.lineTo(width / 2 + 80, 390);
    ctx.stroke();

    // Schedule items
    const schedule = [
      { time: '19H30', title: 'Accueil & Coupe de Bienvenue', desc: 'Cocktail d’ouverture dans les salons' },
      { time: '20H45', title: 'Dîner Gastronomique', desc: 'Menu d’exception orchestré par nos chefs étoilés' },
      { time: '22H15', title: 'Vente aux Enchères Caritative', desc: 'Au profit de la fondation pour l’enfance' },
      { time: '23H30', title: 'Bal & Soirée Dansante', desc: 'Concert live et festivités jusqu’au bout de la nuit' },
    ];

    let startY = 540;
    schedule.forEach((item) => {
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#d4af37';
      ctx.fillText(item.time, width / 2, startY);

      ctx.font = '600 26px "Didot", Georgia, serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(item.title, width / 2, startY + 45);

      ctx.font = '400 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(item.desc, width / 2, startY + 80);

      startY += 160;
    });

    pages.push(canvas.toDataURL('image/jpeg', 0.94));
  }

  // 3. Intérieur Droite (Page 3)
  {
    const { canvas, ctx } = createBaseCanvas();
    ctx.fillStyle = '#fcfbfa';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 80, width - 160, height - 160);

    ctx.font = 'italic 32px "Didot", Georgia, serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('Nous avons l’immense honneur', width / 2, 400);
    ctx.fillText('de solliciter votre présence au', width / 2, 455);

    ctx.font = '600 58px "Didot", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Grand Gala Annuel', width / 2, 560);

    ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('Une célébration dédiée à l’art, au mécénat', width / 2, 680);
    ctx.fillText('et au rayonnement de notre communauté.', width / 2, 725);

    // RSVP Card Box
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 380, 860, 760, 320, 24);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('RÉPONSE SOUHAITÉE AVANT LE 15 OCTOBRE', width / 2, 940);

    ctx.font = '400 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Contact : rsvp@galadeprestige.com • Tél : 01 42 68 00 00', width / 2, 990);
    ctx.fillText('Tenue de soirée exigée (Black Tie)', width / 2, 1050);

    pages.push(canvas.toDataURL('image/jpeg', 0.94));
  }

  // 4. Couverture Arrière / Dos (Page 4)
  {
    const { canvas, ctx } = createBaseCanvas();
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#17150e');
    grad.addColorStop(1, '#0d0b07');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Center Minimal Logo
    ctx.font = 'italic 48px "Didot", Georgia, serif';
    ctx.fillStyle = '#d4af37';
    ctx.textAlign = 'center';
    ctx.fillText('MOCKZ EDITIONS', width / 2, height / 2 - 30);

    ctx.font = '300 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PARIS • LONDRES • NEW YORK', width / 2, height / 2 + 30);

    // Bottom copyright
    ctx.font = '400 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Impression d’art sur papier couché 350g avec dorure à chaud', width / 2, height - 140);
    ctx.fillText('Tous droits réservés © 2026', width / 2, height - 105);

    pages.push(canvas.toDataURL('image/jpeg', 0.94));
  }

  return pages;
}

