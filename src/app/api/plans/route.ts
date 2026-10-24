import { NextResponse } from 'next/server';
import { dbGetAllPlans, dbSavePlans, dbDeletePlan } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await dbGetAllPlans();
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const plans = Array.isArray(body) ? body : [body];
    await dbSavePlans(plans);
    return NextResponse.json({ success: true, message: 'Plans saved to cloud database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');
    if (!planId) {
      return NextResponse.json({ success: false, error: 'Missing plan id' }, { status: 400 });
    }
    await dbDeletePlan(planId);
    return NextResponse.json({ success: true, message: 'Plan deleted from cloud database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
