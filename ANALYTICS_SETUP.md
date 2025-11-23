# Analytics & Data Visualization Setup Guide

This guide provides comprehensive documentation for the analytics and data visualization features implemented in the Streho athlete performance tracking application.

## Overview

A complete data visualization system has been implemented featuring:
- Interactive charts and graphs
- Real-time performance tracking
- Training consistency monitoring
- Activity breakdown analysis
- Performance trends visualization
- Heart rate zone analysis

## Technology Stack

### Charting Library: Recharts

**Why Recharts was chosen:**
- Excellent TypeScript support out of the box
- Built on D3.js for powerful visualizations
- React-first design philosophy
- Responsive by default
- Highly customizable
- Great documentation and community support
- Works seamlessly with Tailwind CSS
- Lightweight and performant

**Alternatives considered:**
- Chart.js: More traditional, requires react-chartjs-2 wrapper
- Tremor: Opinionated design, less flexible for custom styling
- Victory: Good but more verbose API

## Features Implemented

### 1. Chart Components

All chart components are located in `/components/charts/` directory:

#### TrainingVolumeChart
- **File**: `components/charts/TrainingVolumeChart.tsx`
- **Type**: Line chart
- **Metrics**: Duration (minutes) or Distance (km)
- **Features**:
  - Toggleable metrics
  - Custom tooltips
  - Loading states
  - Empty states
  - Responsive design

#### ActivityBreakdownChart
- **File**: `components/charts/ActivityBreakdownChart.tsx`
- **Type**: Pie chart
- **Purpose**: Shows distribution of activity types
- **Features**:
  - Color-coded activity types
  - Percentage labels
  - Activity counts in legend
  - Interactive tooltips

#### PerformanceTrendsChart
- **File**: `components/charts/PerformanceTrendsChart.tsx`
- **Type**: Line chart
- **Metrics**: Pace, Speed, or Distance
- **Features**:
  - Metric selector dropdown
  - Trend visualization
  - Historical comparison

#### HeartRateZonesChart
- **File**: `components/charts/HeartRateZonesChart.tsx`
- **Type**: Bar chart
- **Purpose**: Time spent in each HR zone
- **Features**:
  - Zone-specific colors
  - Percentage calculations
  - Based on estimated max HR (220 - age)

#### CalendarHeatmap
- **File**: `components/charts/CalendarHeatmap.tsx`
- **Type**: Custom heatmap (GitHub-style)
- **Purpose**: Training consistency visualization
- **Features**:
  - 12-week view
  - Intensity-based coloring
  - Interactive tooltips
  - Activity count and duration

#### StatCard
- **File**: `components/charts/StatCard.tsx`
- **Type**: Summary metric card
- **Features**:
  - Trend indicators (up/down/neutral)
  - Icons
  - Loading skeleton
  - Percentage changes

### 2. Date Range Selector

- **File**: `components/charts/DateRangeSelector.tsx`
- **Options**:
  - Last 7 days
  - Last 30 days
  - Last 90 days
  - Last year
  - Custom range (with date picker modal)

### 3. API Routes

All analytics API routes are in `/app/api/analytics/`:

#### GET /api/analytics/training-volume
- **Query Params**: `range` (7d, 30d, 90d, 1y)
- **Returns**: Daily training volume (duration and distance)
- **Data**: Aggregated by date

#### GET /api/analytics/activity-breakdown
- **Query Params**: `range` (7d, 30d, 90d, 1y)
- **Returns**: Activity type distribution
- **Data**: Total distance and count per activity type

#### GET /api/analytics/performance-trends
- **Query Params**: `range`, `activityType` (optional)
- **Returns**: Performance metrics over time
- **Data**: Average pace, speed, and distance

#### GET /api/analytics/heart-rate-zones
- **Query Params**: `range` (7d, 30d, 90d, 1y)
- **Returns**: Time spent in each HR zone
- **Calculation**: Based on user's age (from profile)

#### GET /api/analytics/calendar-heatmap
- **Query Params**: None (fixed to last 84 days)
- **Returns**: Daily activity count and duration
- **Purpose**: Training consistency visualization

### 4. Analytics Dashboard Page

- **File**: `app/dashboard/analytics/page.tsx`
- **Route**: `/dashboard/analytics`
- **Features**:
  - Summary statistics cards
  - Date range filtering
  - All 5 chart visualizations
  - Responsive grid layout
  - Loading states
  - Error handling

## Installation

All dependencies are already installed:

```json
{
  "dependencies": {
    "recharts": "^2.x.x",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "ts-node": "^10.x.x"
  }
}
```

## Usage

### Viewing Analytics

1. Log in as an athlete
2. Navigate to the dashboard
3. Click "View Analytics" in Quick Actions
4. Or visit `/dashboard/analytics` directly

### Date Range Selection

Use the date range selector at the top of the page:
- Click preset buttons (7d, 30d, 90d, 1y)
- Or click "Custom" to select specific dates

### Metric Toggles

Some charts have metric toggles:
- **Training Volume**: Switch between Duration and Distance
- **Performance Trends**: Select Pace, Speed, or Distance

## Seeding Sample Data

To populate sample training data for testing:

### Step 1: Get User ID

Find your user ID from the database:

```sql
SELECT id, email, name FROM "User" WHERE email = 'your-email@example.com';
```

### Step 2: Run Seed Script

```bash
npx ts-node prisma/seed/trainingData.ts <userId>
```

Example:
```bash
npx ts-node prisma/seed/trainingData.ts clxxxxxxxxxxxxxx
```

### What the Seed Script Does

- Generates 90 days of training data
- Creates realistic activities:
  - Running (3-15km, 20-90min)
  - Cycling (15-60km, 40-180min)
  - Swimming (1-4km, 30-90min)
  - Walking (2-8km, 30-120min)
  - Weightlifting (40-90min)
  - Yoga (40-90min)
- 70% chance of activity per day
- Includes realistic metrics:
  - Distance, duration, calories
  - Heart rate data
  - Elevation gain
  - Pace/speed calculations

## File Structure

```
streho/
├── components/
│   └── charts/
│       ├── TrainingVolumeChart.tsx
│       ├── ActivityBreakdownChart.tsx
│       ├── PerformanceTrendsChart.tsx
│       ├── HeartRateZonesChart.tsx
│       ├── CalendarHeatmap.tsx
│       ├── StatCard.tsx
│       └── DateRangeSelector.tsx
├── app/
│   ├── api/
│   │   └── analytics/
│   │       ├── training-volume/
│   │       │   └── route.ts
│   │       ├── activity-breakdown/
│   │       │   └── route.ts
│   │       ├── performance-trends/
│   │       │   └── route.ts
│   │       ├── heart-rate-zones/
│   │       │   └── route.ts
│   │       └── calendar-heatmap/
│   │           └── route.ts
│   └── dashboard/
│       └── analytics/
│           └── page.tsx
└── prisma/
    └── seed/
        └── trainingData.ts
```

## Design Principles

### Responsive Design
- All charts use ResponsiveContainer from Recharts
- Mobile-first approach
- Grid layouts adapt to screen size
- Touch-friendly on mobile devices

### Accessibility
- Proper ARIA labels on interactive elements
- Color-blind friendly color palette
- Keyboard navigation support
- Screen reader compatible tooltips

### Performance
- Data aggregation done server-side
- Efficient Prisma queries with indexes
- Client-side caching with useEffect
- Lazy loading of chart data

### User Experience
- Loading skeletons for better perceived performance
- Empty states with helpful messages
- Error handling with user-friendly messages
- Smooth transitions and animations

## Color Scheme

Activity type colors (consistent across all charts):
- Running: Blue (#3B82F6)
- Cycling: Green (#10B981)
- Swimming: Cyan (#06B6D4)
- Walking: Purple (#8B5CF6)
- Weightlifting: Amber (#F59E0B)
- Yoga: Pink (#EC4899)
- Other: Gray (#6B7280)

Heart rate zone colors:
- Zone 1 (Recovery): Gray (#6B7280)
- Zone 2 (Aerobic): Blue (#3B82F6)
- Zone 3 (Tempo): Green (#10B981)
- Zone 4 (Threshold): Amber (#F59E0B)
- Zone 5 (Maximum): Red (#EF4444)

## Future Enhancements

Potential improvements to consider:

1. **Export Functionality**
   - Download charts as PNG/SVG
   - Export data to CSV
   - PDF report generation

2. **Advanced Filtering**
   - Filter by activity type
   - Filter by location
   - Filter by weather conditions

3. **Comparison Features**
   - Compare different time periods
   - Compare against personal bests
   - Compare with other athletes

4. **Goal Tracking**
   - Set training goals
   - Visual progress indicators
   - Achievement notifications

5. **AI-Powered Insights**
   - Performance predictions
   - Training recommendations
   - Anomaly detection

6. **More Visualizations**
   - Route maps (with GPS data)
   - Power zones (for cycling)
   - Training load/stress charts
   - Recovery metrics

## Troubleshooting

### Charts Not Loading

1. Check browser console for errors
2. Verify API routes are accessible
3. Ensure user is authenticated
4. Check database connection

### Empty Charts

1. Verify user has training activities in database
2. Check date range selection
3. Run seed script to generate sample data
4. Check API responses in Network tab

### Styling Issues

1. Ensure Tailwind CSS is properly configured
2. Check for CSS conflicts
3. Verify responsive classes are applied
4. Test in different browsers

## Performance Optimization Tips

1. **Database Indexes**: Already added in schema
   - `startDate` on TrainingActivity
   - `userId` on all user-related tables
   - `type` on TrainingActivity

2. **API Caching**: Consider implementing:
   - Redis for API response caching
   - SWR or React Query for client-side caching

3. **Data Pagination**: For large datasets:
   - Implement cursor-based pagination
   - Load charts incrementally

## Support

For issues or questions:
1. Check this documentation
2. Review the component source code
3. Check Recharts documentation: https://recharts.org
4. Review Next.js API routes documentation

## Conclusion

The analytics system is now fully functional and ready for production use. All charts include proper loading states, error handling, and empty states. The system is responsive, accessible, and follows best practices for modern web applications.

To get started:
1. Seed sample data using the seed script
2. Log in as an athlete
3. Navigate to /dashboard/analytics
4. Explore your training data visualizations
