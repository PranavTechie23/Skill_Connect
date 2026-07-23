import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for Avatars (Images)
export const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillconnect/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
  } as any, // Using 'any' since multer-storage-cloudinary types sometimes conflict with latest Cloudinary options
});

// Storage for Resumes (PDFs, Docs)
export const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillconnect/resumes',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx'],
  } as any,
});

// Storage for Job Application Attachments (PDFs, Docs)
export const applicationStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillconnect/applications',
    resource_type: 'raw',
  } as any,
});

export { cloudinary };