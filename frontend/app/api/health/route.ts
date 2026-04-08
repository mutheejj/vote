import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const healthData = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'UniElect Frontend',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: 'unknown' as string,
        backend_api: 'unknown' as string,
        cache: 'unknown' as string,
        external_services: 'unknown' as string,
        configuration: 'unknown' as string
      },
      unhealthy_checks: [] as string[]
    };

    // Simple health check for backend API
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Short timeout for health check
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          healthData.checks.backend_api = 'healthy';
        } else {
          healthData.checks.backend_api = 'unhealthy';
        }
      }
    } catch (error) {
      healthData.checks.backend_api = 'unhealthy';
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'NEXT_PUBLIC_API_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );

    if (missingEnvVars.length > 0) {
      healthData.checks.configuration = `Missing env vars: ${missingEnvVars.join(', ')}`;
      healthData.status = 'degraded';
    } else {
      healthData.checks.configuration = 'healthy';
    }

    // Determine overall status
    healthData.unhealthy_checks = Object.entries(healthData.checks)
      .filter(([_, status]) => status === 'unhealthy')
      .map(([check, _]) => check);

    if (healthData.unhealthy_checks.length > 0) {
      healthData.status = 'unhealthy';
    } else if (Object.values(healthData.checks).includes('degraded' as any)) {
      healthData.status = 'degraded';
    }

    const statusCode = healthData.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'UniElect Frontend',
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}