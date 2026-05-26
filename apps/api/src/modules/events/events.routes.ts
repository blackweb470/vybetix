import { Router } from 'express';
import { eventsController } from './events.controller';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import multer from 'multer';

const router = Router();

// Configure multer in-memory storage to capture raw buffer streams
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limits
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted'));
    }
  }
});

router.get('/universities', eventsController.getUniversities);
router.get('/staff/assigned', authMiddleware, requireRole(['gate_staff', 'organizer', 'admin']), eventsController.getAssignedEvents);
router.get('/', eventsController.list);

// Organizer and Admin operations — must be before /:id to avoid route conflicts
router.post('/upload-cover', authMiddleware, requireRole(['organizer', 'admin']), upload.single('cover'), eventsController.uploadCover);
router.post('/', authMiddleware, requireRole(['organizer', 'admin']), upload.none(), eventsController.create);
router.put('/:id', authMiddleware, requireRole(['organizer', 'admin']), upload.none(), eventsController.update);
router.delete('/:id', authMiddleware, requireRole(['organizer', 'admin']), eventsController.delete);
router.post('/:id/staff', authMiddleware, requireRole(['organizer', 'admin']), eventsController.addStaff);
router.get('/:id/staff', authMiddleware, requireRole(['organizer', 'admin']), eventsController.getStaff);
router.delete('/:id/staff/:staffId', authMiddleware, requireRole(['organizer', 'admin']), eventsController.removeStaff);

// Public route — must be after specific routes to avoid eating them
router.get('/:id', eventsController.getById);

export default router;

