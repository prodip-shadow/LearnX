import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const teacherEmail = searchParams.get('teacherEmail');
    const studentView = searchParams.get('studentView') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const resourcesCollection = await getCollection('resources');

    let query = {};

    // Support fetching by teacherId (Firebase UID) or teacherEmail
    if (teacherEmail) {
      // Query by email (used by student view)
      query.teacherEmail = teacherEmail;
      console.log('Fetching resources by email:', teacherEmail);
    } else if (teacherId) {
      // TeacherId can be either ObjectId or Firebase UID string
      if (/^[0-9a-fA-F]{24}$/.test(teacherId)) {
        // Valid ObjectId format
        query.teacherId = new ObjectId(teacherId);
      } else {
        // Firebase UID or other string format
        query.teacherId = teacherId;
      }
      console.log('Fetching resources by teacherId:', teacherId);
    }

    console.log('Query:', query);

    const total = await resourcesCollection.countDocuments(query);
    const resources = await resourcesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('Found resources:', resources.length);

    const totalPages = Math.ceil(total / limit);

    return Response.json({
      success: true,
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get resources error:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch resources' },
      { status: 500 },
    );
  }
}
