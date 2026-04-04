import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';

// Configurar o caminho do executável do ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const PUBLIC_ASSETS = path.join(__dirname, '../../public/assets');
const OUTPUT_DIR = PUBLIC_ASSETS;

async function processVideo(filename: string, subfolder: string, fps: number = 24, scale: string = '1280:-1') {
  const inputPath = path.join(PUBLIC_ASSETS, filename);
  const outDir = path.join(OUTPUT_DIR, subfolder);

  if (!fs.existsSync(inputPath)) {
    console.error(`Clip não encontrado: ${inputPath}`);
    return;
  }

  // Limpar diretório de saída se já existir para evitar lixo de execuções anteriores
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Processing ${filename} -> ${subfolder} (${fps}fps)...`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        `-vf fps=${fps},scale=${scale}`,
        '-q:v 75', // Qualidade WebP (0-100)
        '-loop 0'
      ])
      .output(path.join(outDir, 'frame-%04d.webp'))
      .on('end', () => {
        console.log(`Finalizado: ${subfolder}`);
        resolve(true);
      })
      .on('error', (err) => {
        console.error(`Erro ao processar ${filename}:`, err);
        reject(err);
      })
      .run();
  });
}

async function run() {
  try {
    // 1. Hero Video
    console.log('--- PROCESSANDO HERO ---');
    await processVideo('hero-video.mp4', 'hero-frames/desktop', 40, '1920:-1');
    await processVideo('hero-video-mobile.mp4', 'hero-frames/mobile', 40, '720:-1');
    
    // 2. Video Section - Reduzido para 20fps para evitar crash de memória (vídeo longo)
    console.log('--- PROCESSANDO VIDEO SECTION ---');
    await processVideo('video_section.mp4', 'video-section-frames/desktop', 20, '1920:-1');
    await processVideo('video_section-mobile.mp4', 'video-section-frames/mobile', 20, '720:-1');

    console.log('--- TODOS OS VÍDEOS PROCESSADOS ---');
  } catch (error) {
    console.error('Falha no processamento:', error);
  }
}

run();
