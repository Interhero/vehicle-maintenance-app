import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Vehicle Maintenance App',
        short_name: 'Maintenance',
        description: 'Track your vehicle roadtax and insurance expiries.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/icon.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
            },
            {
                src: '/icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
            },
        ],
    }
}
