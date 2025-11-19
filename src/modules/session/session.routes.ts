// src/modules/session/session.routes.ts
import { Router } from 'express';
import { sessionController } from './session.module';

const sessionRoute = Router();

/**
 * @swagger
 * /session/all:
 *   get:
 *     summary: Get all sessions for current user
 *     tags: [Session]
 *     security:
 *       - cookieAuth: []
 *     description: Returns list of all active sessions for the authenticated user
 *     responses:
 *       200:
 *         description: List of user sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       userId:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439012
 *                       userAgent:
 *                         type: string
 *                         example: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-15T10:30:00.000Z
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-22T10:30:00.000Z
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
sessionRoute.get('/all', sessionController.getAllSession);

/**
 * @swagger
 * /session:
 *   get:
 *     summary: Get current session details
 *     tags: [Session]
 *     security:
 *       - cookieAuth: []
 *     description: Returns details of the current authenticated session
 *     responses:
 *       200:
 *         description: Current session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     userId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439012
 *                     userAgent:
 *                       type: string
 *                       example: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 */
sessionRoute.get('/', sessionController.getSession);

/**
 * @swagger
 * /session/{id}:
 *   delete:
 *     summary: Delete a specific session
 *     tags: [Session]
 *     security:
 *       - cookieAuth: []
 *     description: Logs out a specific session by ID. Useful for remote logout.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to delete
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Session deleted successfully
 *       401:
 *         description: Unauthorized - can only delete own sessions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
sessionRoute.delete('/:id', sessionController.deleteSession);

export default sessionRoute;
