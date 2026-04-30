import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(request) {
  try {
    const { resourceId, teacherId, deleteAll } = await request.json();

    if (!teacherId) {
      return Response.json({ error: 'Missing teacherId' }, { status: 400 });
    }

    const resourcesCollection = await getCollection('resources');

    // build teacherId match that supports either stored string UID or ObjectId
    const teacherIdCandidates = [teacherId];
    if (ObjectId.isValid(teacherId)) {
      teacherIdCandidates.push(new ObjectId(teacherId));
    }

    // delete all for this teacher
    if (deleteAll === true || deleteAll === 'true') {
      const res = await resourcesCollection.deleteMany({
        teacherId: { $in: teacherIdCandidates },
      });
      return Response.json({
        success: true,
        message: `Deleted ${res.deletedCount} resource(s)`,
      });
    }

    if (!resourceId) {
      return Response.json({ error: 'Missing resourceId' }, { status: 400 });
    }

    if (!ObjectId.isValid(resourceId)) {
      return Response.json({ error: 'Invalid resourceId' }, { status: 400 });
    }

    // Verify teacher owns this resource (match by stored teacherId string or ObjectId)
    const resource = await resourcesCollection.findOne({
      _id: new ObjectId(resourceId),
      teacherId: { $in: teacherIdCandidates },
    });

    if (!resource) {
      return Response.json(
        { error: 'Resource not found or unauthorized' },
        { status: 404 },
      );
    }

    await resourcesCollection.deleteOne({ _id: new ObjectId(resourceId) });

    return Response.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    return Response.json(
      { error: error.message || 'Failed to delete resource' },
      { status: 500 },
    );
  }
}
