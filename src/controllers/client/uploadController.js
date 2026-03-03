// src/controllers/client/uploadController.js - Handle image uploads
const { getSupabase } = require('../../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
});

async function uploadImage(req, res) {
  try {
    const companyId = req.user.company_id;
    const userId = req.user.id;
    const supabase = getSupabase();

    console.log('📸 Starting image upload for company:', companyId);

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        code: 'NO_FILE'
      });
    }

    const file = req.file;
    console.log('📸 File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = path.extname(file.originalname);
    const fileName = `products/${companyId}/${timestamp}_${randomString}${fileExt}`;

    console.log('📸 Generated filename:', fileName);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    console.log('📸 File uploaded to Supabase:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('📸 Public URL generated:', publicUrl);

    // Optionally, save upload record to database
    try {
      await supabase
        .from('file_uploads')
        .insert([{
          filename: fileName,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          public_url: publicUrl,
          uploaded_by: userId,
          company_id: companyId,
          upload_type: 'product_image',
          created_at: new Date().toISOString()
        }]);
      
      console.log('📸 Upload record saved to database');
    } catch (dbError) {
      console.warn('⚠️ Failed to save upload record:', dbError.message);
      // Don't fail the request if we can't save the record
    }

    res.json({
      message: 'Image uploaded successfully',
      url: publicUrl,
      filename: fileName,
      size: file.size,
      type: file.mimetype
    });

  } catch (error) {
    console.error('Upload image error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to upload image';
    
    if (error.message.includes('Invalid file type')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('File too large')) {
      statusCode = 400;
      errorMessage = 'File size must be less than 5MB';
    }

    res.status(statusCode).json({
      error: errorMessage,
      code: 'UPLOAD_ERROR'
    });
  }
}

async function deleteImage(req, res) {
  try {
    const { filename } = req.params;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('🗑️ Deleting image:', filename);

    // Verify the file belongs to this company
    if (!filename.includes(`products/${companyId}/`)) {
      return res.status(403).json({
        error: 'Unauthorized to delete this file',
        code: 'UNAUTHORIZED'
      });
    }

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filename]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    // Update database record
    try {
      await supabase
        .from('file_uploads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('filename', filename)
        .eq('company_id', companyId);
    } catch (dbError) {
      console.warn('⚠️ Failed to update upload record:', dbError.message);
    }

    console.log('✅ Image deleted successfully');

    res.json({
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      error: 'Failed to delete image',
      code: 'DELETE_ERROR'
    });
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  upload
};