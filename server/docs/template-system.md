# Template System Documentation

## Template Naming Convention

Templates follow this naming convention:
```{TYPE}_{DAY}_{SESSION}_{VOLATILITY}.xml```

Where:
- **TYPE**: ATM or Flazh
- **DAY**: MON, TUE, WED, THU, FRI (optional)
- **SESSION**: LM (Late Morning), EA (Early Afternoon), PC (Pre-Close)
- **VOLATILITY**: LOW, MED, HIGH

Examples:
- `ATM_MON_LM_HIGH.xml` - ATM template for Monday Late Morning High Volatility
- `FLAZH_EA_MED.xml` - Flazh template for Early Afternoon Medium Volatility (any day)

## Template Selection Logic

The system selects templates using the following priority:

1. Day-specific template matching current session and volatility
2. Generic template matching current session and volatility
3. Generic template matching current session with medium volatility
4. Any template for the current session
5. Any template at all

This allows for progressive specialization of templates over time while maintaining backward compatibility with the existing template system.

## Creating Day-Specific Templates

To create a day-specific template:

1. Start with an existing template that works well for a specific session/volatility
2. Rename it to include the day code (MON, TUE, etc.)
3. Modify the parameters as needed for that specific day
4. Place the file in the appropriate NinjaTrader directory

The system will automatically detect and use day-specific templates when available.