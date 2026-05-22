/**
 * Generate a promotional Instagram-ready image using Canvas API
 */
export async function generateInstagramImage(
  product: { name: string; selling_price: number; category?: string | null },
  themeColor: string = "#e87b35"
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
  bgGrad.addColorStop(0, "#0f0f0f");
  bgGrad.addColorStop(1, "#1a1a2e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Subtle grid pattern
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 1080; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1080); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
  }

  // Accent glow circle
  const glowGrad = ctx.createRadialGradient(800, 300, 0, 800, 300, 400);
  glowGrad.addColorStop(0, themeColor + "30");
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(400, 0, 680, 700);

  // "AVAILABLE NOW" tag top-left
  const tagWidth = 320;
  const tagHeight = 48;
  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.roundRect(50, 50, tagWidth, tagHeight, 8);
  ctx.fill();
  ctx.font = "bold 22px 'Inter', 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("✨ AVAILABLE NOW", 50 + tagWidth / 2, 50 + 32);

  // Category badge
  if (product.category) {
    ctx.font = "600 18px 'Inter', 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    const catWidth = ctx.measureText(product.category.toUpperCase()).width + 32;
    ctx.beginPath();
    ctx.roundRect(50, 130, catWidth, 36, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "left";
    ctx.fillText(product.category.toUpperCase(), 66, 155);
  }

  // Product name - large
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px 'Inter', 'Segoe UI', sans-serif";
  const words = product.name.split(" ");
  let line = "";
  let y = 320;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > 900) {
      ctx.fillText(line.trim(), 60, y);
      line = word + " ";
      y += 78;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), 60, y);

  // Decorative line
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(60, y + 30);
  ctx.lineTo(300, y + 30);
  ctx.stroke();

  // Price section
  const priceY = y + 120;
  ctx.font = "500 24px 'Inter', 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("PRICE", 60, priceY);
  ctx.font = "bold 72px 'Inter', 'Segoe UI', sans-serif";
  ctx.fillStyle = themeColor;
  ctx.fillText(`TZS ${product.selling_price.toLocaleString()}`, 60, priceY + 80);

  // Price badge in corner
  const badgeSize = 160;
  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.arc(1080 - 100, 100, badgeSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px 'Inter', 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FROM", 980, 85);
  ctx.font = "bold 24px 'Inter', 'Segoe UI', sans-serif";
  ctx.fillText(`TZS`, 980, 110);
  ctx.font = "bold 20px 'Inter', 'Segoe UI', sans-serif";
  ctx.fillText(product.selling_price.toLocaleString(), 980, 132);

  // Bottom bar
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 980, 1080, 100);
  ctx.font = "500 20px 'Inter', 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "left";
  ctx.fillText("Order Now • DM or WhatsApp", 60, 1040);
  ctx.textAlign = "right";
  ctx.fillText("ZEETOP", 1020, 1040);

  return canvas.toDataURL("image/png");
}
