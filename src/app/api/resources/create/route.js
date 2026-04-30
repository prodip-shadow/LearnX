import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const {
      teacherId,
      teacherName,
      teacherEmail,
      title,
      type,
      url,
      fileName,
      fileSize,
      fileBase64,
      description,
    } = await request.json();

    if (!teacherId || !title || !type) {
      return Response.json(
        { error: 'Missing required fields: teacherId, title, type' },
        { status: 400 },
      );
    }

    // Validate teacherId - it can be either a valid ObjectId or a Firebase UID string
    let teacherObjectId;
    try {
      // Try to create ObjectId if it's a valid 24-char hex string
      if (
        typeof teacherId === 'string' &&
        /^[0-9a-fA-F]{24}$/.test(teacherId)
      ) {
        teacherObjectId = new ObjectId(teacherId);
      } else {
        // Otherwise store as string (for Firebase UIDs)
        teacherObjectId = teacherId;
      }
    } catch (e) {
      // If ObjectId creation fails, use as string
      teacherObjectId = teacherId;
    }

    // Validate document size
    if (type === 'document' && fileSize && fileSize > 5 * 1024 * 1024) {
      return Response.json(
        { error: 'Document size must not exceed 5MB' },
        { status: 400 },
      );
    }

    const resourcesCollection = await getCollection('resources');

    const resource = {
      teacherId: teacherObjectId,
      teacherName: teacherName || 'Unknown',
      teacherEmail: teacherEmail || '',
      title,
      type, // youtube, document, drive, image, question, answer
      url: url || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      fileBase64: fileBase64 || null,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await resourcesCollection.insertOne(resource);

    return Response.json(
      {
        success: true,
        resourceId: result.insertedId,
        message: 'Resource created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create resource error:', error);
    return Response.json(
      { error: error.message || 'Failed to create resource' },
      { status: 500 },
    );
  }
}
