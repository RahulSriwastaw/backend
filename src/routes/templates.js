import express from 'express';
import Template from '../models/Template.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', async (req, res) => {
  try {
    // Check MongoDB connection first
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected, falling back to JSON file');
      try {
        const templatesPath = join(__dirname, '..', '..', '..', '..', 'frontend', 'frontend', 'data', 'templates.json');
        const data = await readFile(templatesPath, 'utf-8');
        const templates = JSON.parse(data);
        return res.json(templates);
      } catch (fileError) {
        console.error('Failed to read templates.json:', fileError);
        return res.json([]);
      }
    }

    // Try MongoDB first with timeout
    try {
      // Set a timeout for the query
      const queryPromise = Template.find({ 
        status: 'approved',
        $or: [
          { isActive: true },
          { isActive: { $exists: false } }
        ]
      }).sort({ createdAt: -1 }).maxTimeMS(5000); // 5 second timeout
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      );
      
      const templates = await Promise.race([queryPromise, timeoutPromise]);
      
      console.log(`Found ${templates.length} approved templates (status: approved, isActive: true or not set)`);
      // Convert MongoDB format to frontend format
      const formattedTemplates = templates.map(t => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        demoImage: t.demoImage,
        category: t.category,
        subCategory: t.subCategory,
        tags: t.tags,
        creatorId: t.creatorId?.toString() || 'admin',
        creatorName: t.creatorName,
        creatorVerified: t.creatorVerified,
        hiddenPrompt: t.hiddenPrompt,
        isFree: !t.isPremium,
        pointsCost: t.pointsCost,
        usageCount: t.usageCount,
        likeCount: t.likeCount,
        saveCount: t.saveCount,
        rating: t.rating,
        ratingCount: t.ratingCount,
        ageGroup: t.ageGroup,
        state: t.state,
        createdAt: t.createdAt,
        status: t.status,
        isActive: t.isActive,
        exampleImages: t.exampleImages || [],
        visiblePrompt: t.visiblePrompt,
        creatorBio: t.creatorBio,
      }));
      return res.json(formattedTemplates);
    } catch (mongoError) {
      console.warn('MongoDB query failed, falling back to JSON file:', mongoError.message);
      // Fallback to JSON file
      try {
        const templatesPath = join(__dirname, '..', '..', '..', '..', 'frontend', 'frontend', 'data', 'templates.json');
        const data = await readFile(templatesPath, 'utf-8');
        const templates = JSON.parse(data);
        return res.json(templates);
      } catch (fileError) {
        console.error('Failed to read templates.json:', fileError);
        // Return empty array if both MongoDB and file fail
        return res.json([]);
      }
    }
  } catch (error) {
    console.error('Error loading templates:', error);
    res.status(500).json({ error: 'Failed to load templates', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    // Check MongoDB connection first
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected, falling back to JSON file');
      try {
        const templatesPath = join(__dirname, '..', '..', '..', '..', 'frontend', 'frontend', 'data', 'templates.json');
        const data = await readFile(templatesPath, 'utf-8');
        const templates = JSON.parse(data);
        const template = templates.find(t => t.id === req.params.id);
        if (!template) {
          return res.status(404).json({ error: 'Template not found' });
        }
        return res.json(template);
      } catch (fileError) {
        console.error('Failed to read templates.json:', fileError);
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    // Try MongoDB first with timeout
    try {
      const queryPromise = Template.findById(req.params.id).maxTimeMS(5000);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      );
      
      const template = await Promise.race([queryPromise, timeoutPromise]);
      if (!template || template.status !== 'approved' || !template.isActive) {
        return res.status(404).json({ error: 'Template not found' });
      }
      // Convert to frontend format
      const formatted = {
        id: template._id.toString(),
        title: template.title,
        description: template.description,
        demoImage: template.demoImage,
        category: template.category,
        subCategory: template.subCategory,
        tags: template.tags,
        creatorId: template.creatorId?.toString() || 'admin',
        creatorName: template.creatorName,
        creatorVerified: template.creatorVerified,
        hiddenPrompt: template.hiddenPrompt,
        isFree: !template.isPremium,
        pointsCost: template.pointsCost,
        usageCount: template.usageCount,
        likeCount: template.likeCount,
        saveCount: template.saveCount,
        rating: template.rating,
        ratingCount: template.ratingCount,
        ageGroup: template.ageGroup,
        state: template.state,
        createdAt: template.createdAt,
        status: template.status,
        isActive: template.isActive,
        exampleImages: template.exampleImages || [],
        visiblePrompt: template.visiblePrompt,
        creatorBio: template.creatorBio,
      };
      return res.json(formatted);
    } catch (mongoError) {
      console.warn('MongoDB query failed, falling back to JSON file:', mongoError.message);
      // Fallback to JSON file
      try {
        const templatesPath = join(__dirname, '..', '..', '..', '..', 'frontend', 'frontend', 'data', 'templates.json');
        const data = await readFile(templatesPath, 'utf-8');
        const templates = JSON.parse(data);
        const template = templates.find(t => t.id === req.params.id);
        
        if (!template) {
          return res.status(404).json({ error: 'Template not found' });
        }
        
        return res.json(template);
      } catch (fileError) {
        console.error('Failed to read templates.json:', fileError);
        return res.status(404).json({ error: 'Template not found' });
      }
    }
  } catch (error) {
    console.error('Error loading template:', error);
    res.status(500).json({ error: 'Failed to load template', details: error.message });
  }
});

export default router;
