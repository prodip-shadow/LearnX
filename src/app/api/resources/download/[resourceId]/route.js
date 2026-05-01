import { ObjectId } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

const getBase64Payload = (rawBase64 = '') => {
  if (!rawBase64) return '';
  if (rawBase64.startsWith('data:')) {
    const parts = rawBase64.split(',');
    return parts[1] || '';
  }
  return rawBase64;
};

const getMimeType = (resource = {}) => {
  const fileName = (resource.fileName || '').toLowerCase();
  const url = (resource.url || '').toLowerCase();
  const base64 = resource.fileBase64 || '';

  if (
    base64.includes('application/pdf') ||
    fileName.endsWith('.pdf') ||
    url.endsWith('.pdf')
  ) {
    return 'application/pdf';
  }

  if (
    base64.includes('image/png') ||
    fileName.endsWith('.png') ||
    url.endsWith('.png')
  ) {
    return 'image/png';
  }

  if (
    base64.includes('image/jpeg') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg')
  ) {
    return 'image/jpeg';
  }

  if (base64.includes('text/plain') || fileName.endsWith('.txt')) {
    return 'text/plain; charset=utf-8';
  }

  return 'application/octet-stream';
};

export async function GET(request, { params }) {
  try {
    const { resourceId } = await params;

    if (!resourceId || !ObjectId.isValid(resourceId)) {
      return Response.json({ error: 'Invalid resourceId' }, { status: 400 });
    }

    const resourcesCollection = await getCollection('resources');
    const resource = await resourcesCollection.findOne({
      _id: new ObjectId(resourceId),
    });

    if (!resource) {
      return Response.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (!resource.fileBase64) {
      if (resource.url) {
        return Response.redirect(resource.url, 302);
      }
      return Response.json(
        { error: 'No file content available' },
        { status: 404 },
      );
    }

    const payload = getBase64Payload(resource.fileBase64);
    const buffer = Buffer.from(payload, 'base64');
    const contentType = getMimeType(resource);
    const fileName = resource.fileName || `${resource.title || 'resource'}`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Download resource error:', error);
    return Response.json(
      { error: error.message || 'Failed to download resource' },
      { status: 500 },
    );
  }
}
