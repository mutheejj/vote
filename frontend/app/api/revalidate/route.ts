import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

// Helper to verify auth token
async function verifyAuth(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('unielect-voting-access-token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    // Call backend to verify token and get user info
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Revalidate specific paths or tags for cache management
export async function POST(request: NextRequest) {
  try {
    // Get the current user to verify authentication
    const user = await verifyAuth(request);

    // Check if user is authenticated and has appropriate permissions
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admins and super admins to trigger revalidation
    const userRole = user.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, path, tag, tags } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Revalidation type is required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'path':
        if (!path) {
          return NextResponse.json(
            { error: 'Path is required for path revalidation' },
            { status: 400 }
          );
        }
        revalidatePath(path);
        return NextResponse.json(
          { message: `Path '${path}' revalidated successfully` },
          { status: 200 }
        );

      case 'tag':
        if (!tag) {
          return NextResponse.json(
            { error: 'Tag is required for tag revalidation' },
            { status: 400 }
          );
        }
        revalidateTag(tag);
        return NextResponse.json(
          { message: `Tag '${tag}' revalidated successfully` },
          { status: 200 }
        );

      case 'multiple-tags':
        if (!tags || !Array.isArray(tags)) {
          return NextResponse.json(
            { error: 'Tags array is required for multiple tag revalidation' },
            { status: 400 }
          );
        }
        tags.forEach((tagName: string) => revalidateTag(tagName));
        return NextResponse.json(
          { message: `Tags [${tags.join(', ')}] revalidated successfully` },
          { status: 200 }
        );

      case 'election':
        // Revalidate election-related pages
        const electionPaths = [
          '/elections',
          '/admin/elections',
          '/dashboard',
          '/admin/dashboard'
        ];
        electionPaths.forEach(path => revalidatePath(path));

        const electionTags = [
          'elections',
          'election-list',
          'election-stats',
          'dashboard-data'
        ];
        electionTags.forEach(tag => revalidateTag(tag));

        return NextResponse.json(
          { message: 'Election-related pages revalidated successfully' },
          { status: 200 }
        );

      case 'voting':
        // Revalidate voting-related pages
        const votingPaths = [
          '/elections',
          '/vote',
          '/results',
          '/dashboard'
        ];
        votingPaths.forEach(path => revalidatePath(path));

        const votingTags = [
          'voting-data',
          'election-results',
          'vote-stats',
          'dashboard-data'
        ];
        votingTags.forEach(tag => revalidateTag(tag));

        return NextResponse.json(
          { message: 'Voting-related pages revalidated successfully' },
          { status: 200 }
        );

      case 'candidates':
        // Revalidate candidate-related pages
        const candidatePaths = [
          '/elections',
          '/admin/candidates',
          '/admin/elections'
        ];
        candidatePaths.forEach(path => revalidatePath(path));

        const candidateTags = [
          'candidates',
          'candidate-list',
          'election-candidates'
        ];
        candidateTags.forEach(tag => revalidateTag(tag));

        return NextResponse.json(
          { message: 'Candidate-related pages revalidated successfully' },
          { status: 200 }
        );

      case 'users':
        // Revalidate user-related pages
        const userPaths = [
          '/admin/voters',
          '/admin/dashboard'
        ];
        userPaths.forEach(path => revalidatePath(path));

        const userTags = [
          'users',
          'voters',
          'user-stats'
        ];
        userTags.forEach(tag => revalidateTag(tag));

        return NextResponse.json(
          { message: 'User-related pages revalidated successfully' },
          { status: 200 }
        );

      case 'results':
        // Revalidate results-related pages
        const resultPaths = [
          '/results',
          '/admin/results',
          '/elections'
        ];
        resultPaths.forEach(path => revalidatePath(path));

        const resultTags = [
          'results',
          'election-results',
          'result-analytics'
        ];
        resultTags.forEach(tag => revalidateTag(tag));

        return NextResponse.json(
          { message: 'Results-related pages revalidated successfully' },
          { status: 200 }
        );

      case 'dashboard':
        // Revalidate all dashboard pages
        const dashboardPaths = [
          '/dashboard',
          '/admin/dashboard'
        ];
        dashboardPaths.forEach(path => revalidatePath(path));

        const dashboardTags = [
          'dashboard-data',
          'dashboard-stats',
          'user-dashboard',
          'admin-dashboard'
        ];
        dashboardTags.forEach(tag => revalidateTag(tag));

        return NextResponse.json(
          { message: 'Dashboard pages revalidated successfully' },
          { status: 200 }
        );

      case 'all':
        // Revalidate all major pages (use with caution)
        const allPaths = [
          '/',
          '/dashboard',
          '/elections',
          '/vote',
          '/results',
          '/history',
          '/admin/dashboard',
          '/admin/elections',
          '/admin/candidates',
          '/admin/voters',
          '/admin/results',
          '/admin/reports',
          '/admin/audit',
          '/admin/settings'
        ];
        allPaths.forEach(path => revalidatePath(path));

        const allTags = [
          'elections',
          'candidates',
          'voters',
          'results',
          'dashboard-data',
          'voting-data',
          'user-stats',
          'election-stats'
        ];
        allTags.forEach(tag => revalidateTag(tag));

        return NextResponse.json(
          { message: 'All pages revalidated successfully' },
          { status: 200 }
        );

      default:
        return NextResponse.json(
          { error: `Unknown revalidation type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during revalidation' },
      { status: 500 }
    );
  }
}

// GET endpoint to check revalidation status or get available options
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = user.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const availableTypes = [
      {
        type: 'path',
        description: 'Revalidate a specific path',
        parameters: ['path']
      },
      {
        type: 'tag',
        description: 'Revalidate a specific cache tag',
        parameters: ['tag']
      },
      {
        type: 'multiple-tags',
        description: 'Revalidate multiple cache tags',
        parameters: ['tags (array)']
      },
      {
        type: 'election',
        description: 'Revalidate all election-related pages and data',
        parameters: []
      },
      {
        type: 'voting',
        description: 'Revalidate all voting-related pages and data',
        parameters: []
      },
      {
        type: 'candidates',
        description: 'Revalidate all candidate-related pages and data',
        parameters: []
      },
      {
        type: 'users',
        description: 'Revalidate all user-related pages and data',
        parameters: []
      },
      {
        type: 'results',
        description: 'Revalidate all results-related pages and data',
        parameters: []
      },
      {
        type: 'dashboard',
        description: 'Revalidate all dashboard pages',
        parameters: []
      },
      {
        type: 'all',
        description: 'Revalidate all pages (use with caution)',
        parameters: []
      }
    ];

    return NextResponse.json(
      {
        message: 'Available revalidation types',
        types: availableTypes,
        usage: {
          method: 'POST',
          endpoint: '/api/revalidate',
          examples: [
            {
              type: 'path',
              body: { type: 'path', path: '/elections' }
            },
            {
              type: 'tag',
              body: { type: 'tag', tag: 'election-list' }
            },
            {
              type: 'preset',
              body: { type: 'election' }
            }
          ]
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revalidation GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}