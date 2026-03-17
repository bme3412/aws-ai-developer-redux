import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string; topicSlug: string }> }
) {
  const { domainId, topicSlug } = await params;

  try {
    const filePath = path.join(
      process.cwd(),
      'src',
      'data',
      'content',
      `domain-${domainId}`,
      `${topicSlug}.md`
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading markdown:', error);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
