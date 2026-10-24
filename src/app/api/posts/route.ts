import { NextResponse } from 'next/server';
import { dbGetAllPosts, dbSavePosts, dbDeletePost } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await dbGetAllPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const posts = Array.isArray(body) ? body : [body];
    await dbSavePosts(posts);
    return NextResponse.json({ success: true, message: 'Posts saved to cloud database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    if (!postId) {
      return NextResponse.json({ success: false, error: 'Missing post id' }, { status: 400 });
    }
    await dbDeletePost(postId);
    return NextResponse.json({ success: true, message: 'Post deleted from cloud database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
