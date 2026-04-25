# Analytics Quick Start Guide

## Get Started in 3 Steps

### Step 1: Seed Sample Data

```bash
# First, find your user ID (check database or console log after login)
# Then run:
npx ts-node prisma/seed/trainingData.ts YOUR_USER_ID_HERE
```

This creates 90 days of realistic training data.

### Step 2: Start Dev Server

```bash
npm run dev
```

### Step 3: View Analytics

1. Login at http://localhost:3000
2. Go to http://localhost:3000/dashboard/analytics
3. Or click "View Analytics" on dashboard

---

## What You'll See

### 4 Summary Cards
- Total Activities
- Total Distance  
- Total Duration
- Average Duration

### 5 Interactive Charts
1. **Training Consistency** - GitHub-style heatmap (12 weeks)
2. **Training Volume** - Line chart (toggle duration/distance)
3. **Activity Breakdown** - Pie chart (% by activity type)
4. **Performance Trends** - Line chart (pace/speed/distance)
5. **Heart Rate Zones** - Bar chart (time in each zone)

---

## Key Features

### Date Range Selector
Click to filter data:
- Last 7 days
- Last 30 days  
- Last 90 days
- Last year
- Custom range

### Metric Toggles
Some charts let you switch metrics:
- Training Volume: Duration ↔ Distance
- Performance: Pace ↔ Speed ↔ Distance

### Interactive Elements
- Hover tooltips on all charts
- Click legend items to filter
- Responsive on mobile/tablet/desktop

---

## File Locations

```
rytmo/
├── app/
│   ├── api/analytics/              # 5 API routes
│   └── dashboard/analytics/        # Analytics page
├── components/charts/              # 7 chart components
└── prisma/seed/                    # Data generator
```

---

## Customization

### Colors
Edit in respective chart files:
- Activity colors: `components/charts/ActivityBreakdownChart.tsx`
- HR zone colors: `components/charts/HeartRateZonesChart.tsx`

### Date Ranges
Edit in:
- `components/charts/DateRangeSelector.tsx`

### Charts
All charts are in:
- `components/charts/`

---

## Troubleshooting

**Charts Empty?**
- Check if you've seeded data
- Verify date range selection
- Check browser console for errors

**API Errors?**
- Ensure database is running
- Check authentication (must be logged in)
- Verify Prisma schema is up to date

**TypeScript Errors?**
- Run `npm install` again
- Check Node version (should be 18+)

---

## Next Steps

1. Review full documentation: `ANALYTICS_SETUP.md`
2. Read implementation details: `IMPLEMENTATION_SUMMARY.md`
3. Customize charts to your needs
4. Add your own visualizations

---

**Need Help?** Check the comprehensive guides:
- Setup Guide: `ANALYTICS_SETUP.md`
- Implementation Summary: `IMPLEMENTATION_SUMMARY.md`

Happy tracking! 📊
