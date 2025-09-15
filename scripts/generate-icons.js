#!/usr/bin/env node

/**
 * PWA 아이콘 생성 스크립트
 * SVG에서 다양한 크기의 PNG 아이콘을 생성합니다.
 * 
 * 실제 프로덕션에서는 sharp 라이브러리를 사용하여 구현하면 됩니다:
 * npm install sharp
 * 
 * const sharp = require('sharp');
 * const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
 * 
 * sizes.forEach(size => {
 *   sharp('public/icons/icon.svg')
 *     .resize(size, size)
 *     .png()
 *     .toFile(`public/icons/icon-${size}x${size}.png`);
 * });
 */

const fs = require('fs');
const path = require('path');

// 아이콘 크기 목록
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// 플레이스홀더 HTML 생성 (실제로는 canvas나 sharp 라이브러리 사용)
const generatePlaceholderIcon = (size) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .icon {
      width: ${size}px;
      height: ${size}px;
      background: white;
      border-radius: 20%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: ${size * 0.5}px;
      font-weight: bold;
      color: #667eea;
      font-family: system-ui;
    }
  </style>
</head>
<body>
  <div class="icon">W</div>
</body>
</html>`;
};

// 아이콘 생성
sizes.forEach(size => {
  const filename = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.html`);
  fs.writeFileSync(filename, generatePlaceholderIcon(size));
  console.log(`Created placeholder: icon-${size}x${size}.html`);
});

console.log(`
⚠️  플레이스홀더 HTML 파일이 생성되었습니다.
실제 PNG 파일을 생성하려면 다음 도구 중 하나를 사용하세요:

1. Sharp 라이브러리 (Node.js):
   npm install sharp
   
2. ImageMagick (CLI):
   convert icon.svg -resize 192x192 icon-192x192.png
   
3. 온라인 도구:
   https://cloudconvert.com/svg-to-png
`);