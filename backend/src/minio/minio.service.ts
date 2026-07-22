import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import axios from 'axios';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'minio'),
      port: parseInt(
        this.configService.get<string>('MINIO_PORT', '9000'),
        10,
      ),
      useSSL:
        this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>(
        'MINIO_ACCESS_KEY',
        'minioadmin',
      ),
      secretKey: this.configService.get<string>(
        'MINIO_SECRET_KEY',
        'minioadmin',
      ),
    });

    this.bucketName = this.configService.get<string>(
      'MINIO_BUCKET',
      'tool-icons',
    );
  }

  /**
   * Saat module diinisialisasi, pastikan bucket sudah ada
   */
  async onModuleInit() {
    await this.ensureBucket(this.bucketName);
  }

  /**
   * Membuat bucket jika belum ada
   */
  async ensureBucket(bucketName: string): Promise<void> {
    try {
      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName);
        this.logger.log(`Bucket "${bucketName}" berhasil dibuat`);

        // Set bucket policy agar bisa diakses publik (read-only)
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(
          bucketName,
          JSON.stringify(policy),
        );
        this.logger.log(`Bucket "${bucketName}" diset ke public read`);
      } else {
        this.logger.log(`Bucket "${bucketName}" sudah ada`);
      }
    } catch (error) {
      this.logger.error(`Gagal membuat bucket: ${error.message}`);
    }
  }

  /**
   * Upload file buffer ke MinIO
   */
  async uploadFile(
    objectName: string,
    buffer: Buffer,
    contentType: string = 'image/png',
  ): Promise<string> {
    try {
      await this.client.putObject(
        this.bucketName,
        objectName,
        buffer,
        buffer.length,
        {
          'Content-Type': contentType,
        },
      );

      const endpoint = this.configService.get<string>(
        'MINIO_ENDPOINT',
        'minio',
      );
      const port = this.configService.get<string>('MINIO_PORT', '9000');

      const internalUrl = `http://${endpoint}:${port}/${this.bucketName}/${objectName}`;
      const url = this.toExternalUrl(internalUrl);
      this.logger.log(`File berhasil diupload: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(`Gagal upload file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mengubah URL internal MinIO menjadi URL external yang bisa diakses client
   */
  toExternalUrl(url: string): string {
    if (!url) return url;

    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'minio');
    const port = this.configService.get<string>('MINIO_PORT', '9000');
    const internalPrefix = `${endpoint}:${port}`;

    if (url.includes(internalPrefix)) {
      let externalUrl = this.configService.get<string>('MINIO_EXTERNAL_URL');
      if (!externalUrl) {
        externalUrl = 'http://localhost:9000';
      }
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const protocolMatch = url.match(new RegExp(`^(https?://)?${escapeRegex(internalPrefix)}`));
      if (protocolMatch) {
        return url.replace(protocolMatch[0], externalUrl);
      }
    }
    return url;
  }

  /**
   * Download gambar dari URL eksternal, lalu upload ke MinIO
   * Ini adalah flow utama untuk data ingestion:
   * 1. Download gambar dari RapidAPI/external URL
   * 2. Upload ke MinIO bucket
   * 3. Return MinIO internal URL
   */
  async downloadAndUpload(
    externalUrl: string,
    objectName: string,
  ): Promise<string> {
    try {
      this.logger.log(`Downloading image dari: ${externalUrl}`);

      const response = await axios.get(externalUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      const buffer = Buffer.from(response.data);
      const rawContentType = response.headers['content-type'];
      const contentType =
        typeof rawContentType === 'string' ? rawContentType : 'image/png';

      const minioUrl = await this.uploadFile(
        objectName,
        buffer,
        contentType,
      );
      this.logger.log(
        `Image berhasil dipindahkan ke MinIO: ${objectName}`,
      );

      return minioUrl;
    } catch (error) {
      this.logger.warn(
        `Gagal download/upload image "${objectName}": ${error.message}`,
      );
      return ''; // Return empty string jika gagal
    }
  }

  /**
   * Generate presigned URL untuk akses temporary
   */
  async getPresignedUrl(
    objectName: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    return this.client.presignedGetObject(
      this.bucketName,
      objectName,
      expirySeconds,
    );
  }

  /**
   * Hapus file dari MinIO
   */
  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, objectName);
      this.logger.log(`File dihapus: ${objectName}`);
    } catch (error) {
      this.logger.error(`Gagal hapus file: ${error.message}`);
    }
  }
}
