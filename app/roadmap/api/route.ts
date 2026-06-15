import { NextResponse } from 'next/server';
import { Roadmap } from '../types';

export async function GET(request: Request) {
  // In a real application, you would fetch this data from a database.
  const roadmaps: Roadmap[] = [
    { id: '#R001', name: 'Project Alpha', quarter: 'Q3 2026', status: 'In Progress', owner: 'John Doe' },
    { id: '#R002', name: 'Project Beta', quarter: 'Q3 2026', status: 'Completed', owner: 'Jane Smith' },
    { id: '#R003', name: 'Project Gamma', quarter: 'Q4 2026', status: 'Planned', owner: 'Peter Jones' },
    { id: '#R004', name: 'Project Delta', quarter: 'Q4 2026', status: 'In Progress', owner: 'Sam Wilson' },
  ];

  return NextResponse.json(roadmaps);
}