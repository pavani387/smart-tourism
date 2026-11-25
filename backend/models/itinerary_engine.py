import os
import json
import math
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

class SmartItineraryEngine:
    def __init__(self):
        with open(os.path.join(DATA_DIR, "destinations.json"), "r", encoding="utf-8") as f:
            self.destinations = {d["id"]: d for d in json.load(f)}
        with open(os.path.join(DATA_DIR, "hotels.json"), "r", encoding="utf-8") as f:
            self.hotels = json.load(f)
        with open(os.path.join(DATA_DIR, "transport_routes.json"), "r", encoding="utf-8") as f:
            self.routes = json.load(f)

    def generate_itinerary(self, origin="Bangalore", dest_id="ooty", start_date_str="2026-12-10", 
                           days=3, num_people=2, total_budget=15000, 
                           travel_style="Moderate", transport_pref="Car", 
                           is_rainy=False):
        
        dest = self.destinations.get(dest_id)
        if not dest:
            dest = list(self.destinations.values())[0]
            dest_id = dest["id"]

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        except:
            start_date = datetime.now() + timedelta(days=7)

        attractions = list(dest["attractions"])
        
        # Weather-Adaptive Filter: if rainy, prioritize indoor attractions
        weather_alert = None
        if is_rainy:
            weather_alert = {
                "level": "warning",
                "title": "Weather Adaptation Active: Rain Advisory",
                "message": "Rain is anticipated during your travel window. The engine has automatically scheduled indoor museums, cultural tea factories, and covered heritage sites during expected rainfall hours."
            }
            # Sort indoor first
            attractions.sort(key=lambda a: not a.get("indoor", False))

        # Schedule distribution by day
        days_count = max(1, min(days, 5))
        itinerary_days = []
        
        # Slots per day based on travel style
        # Relaxed: 2 spots/day, Moderate: 3 spots/day, Packed: 4 spots/day
        spots_per_day = 2 if travel_style == "Relaxed" else (4 if travel_style == "Packed" else 3)
        
        time_slots = [
            ("09:00 AM", "Morning Sightseeing"),
            ("02:00 PM", "Afternoon Exploration"),
            ("05:00 PM", "Evening Sunset & Culture"),
            ("07:30 PM", "Night Leisure & Shopping")
        ]
        
        lunch_spots = {
            "ooty": ["Nahar Sidewalk Cafe", "Earl's Secret Heritage Dining", "Curry & Rice Nilgiri Room", "Hyderabad Biryani House"],
            "manali": ["Cafe 1947 by the River", "Johnson's Trout Bar", "Chopsticks Tibetan Diner", "Drifters' Cafe"],
            "goa": ["Fisherman's Wharf", "Curlies Beach Shack", "Britto's Baga Beachfront", "Mum's Kitchen Panjim"],
            "jaipur": ["Laxmi Mishthan Bhandar (LMB)", "1135 AD Amber Fort", "Peacock Rooftop Restaurant", "Chokhi Dhani"]
        }
        dest_lunches = lunch_spots.get(dest_id, ["Local Heritage Bistro", "Traveller's Rest Cafe", "Grand Garden Restaurant"])

        attraction_idx = 0
        total_ticket_cost = 0

        for day_num in range(1, days_count + 1):
            current_day_date = start_date + timedelta(days=day_num - 1)
            date_formatted = current_day_date.strftime("%A, %b %d, %Y")
            
            day_schedule = []
            
            # Morning arrival note on Day 1
            if day_num == 1:
                day_schedule.append({
                    "time": "08:00 AM",
                    "title": f"Arrive in {dest['name']} from {origin}",
                    "type": "Transit",
                    "desc": f"Check-in at accommodation, freshen up, and enjoy morning breakfast.",
                    "cost": 0,
                    "indoor": True,
                    "image": dest["image"]
                })
            
            # Allocate attractions
            for slot_idx in range(min(spots_per_day, len(time_slots))):
                if slot_idx == 1:
                    # Lunch break
                    lunch_name = dest_lunches[(day_num - 1) % len(dest_lunches)]
                    day_schedule.append({
                        "time": "12:30 PM",
                        "title": f"Lunch at {lunch_name}",
                        "type": "Dining",
                        "desc": f"Savor authentic regional delicacies and relaxing ambiance.",
                        "cost": 350 * num_people,
                        "indoor": True,
                        "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"
                    })
                
                # Pick attraction
                if attraction_idx < len(attractions):
                    att = attractions[attraction_idx % len(attractions)]
                    attraction_idx += 1
                else:
                    att = {
                        "name": f"Local Cultural Walk & Bazaar in {dest['name']}",
                        "type": "Shopping & Leisure",
                        "fee": 0,
                        "time_hrs": 2.0,
                        "indoor": True,
                        "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80"
                    }
                    
                slot_time = time_slots[slot_idx][0]
                fee = att.get("fee", 0) * num_people
                total_ticket_cost += fee
                
                day_schedule.append({
                    "time": slot_time,
                    "title": att["name"],
                    "type": att.get("type", "Sightseeing"),
                    "desc": f"Explore {att['name']}. Recommended visit duration: ~{att.get('time_hrs', 2)} hours.",
                    "cost": fee,
                    "indoor": att.get("indoor", False),
                    "image": att.get("image", dest["image"])
                })

            # Day end return to hotel / departure
            if day_num == days_count:
                day_schedule.append({
                    "time": "06:30 PM",
                    "title": f"Return Journey back to {origin}",
                    "type": "Transit",
                    "desc": f"Pack luggage, check-out from hotel, and depart via preferred {transport_pref}.",
                    "cost": 0,
                    "indoor": True,
                    "image": dest["image"]
                })
            else:
                day_schedule.append({
                    "time": "08:30 PM",
                    "title": "Dinner & Overnight Rest",
                    "type": "Dining",
                    "desc": "Dinner at hotel dining room or local evening market stall.",
                    "cost": 400 * num_people,
                    "indoor": True,
                    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"
                })

            itinerary_days.append({
                "day_number": day_num,
                "date": date_formatted,
                "theme": f"Day {day_num} - Highlights & Exploration",
                "events": day_schedule
            })

        # Find matching hotel nearby
        dest_hotels = [h for h in self.hotels if h["dest_id"] == dest_id]
        if not dest_hotels:
            dest_hotels = self.hotels[:2]
        
        # Sort by budget suitability
        night_budget = (total_budget * 0.35) / max(days_count - 1, 1)
        dest_hotels.sort(key=lambda h: abs(h["price_night"] - night_budget))
        recommended_hotel = dest_hotels[0]

        # Estimated expenses breakdown
        hotel_total = recommended_hotel["price_night"] * max(days_count - 1, 1)
        transport_est = 2500 * num_people if transport_pref == "Flight" else (1200 * num_people)
        food_est = 900 * num_people * days_count
        shopping_buffer = max(1000, int(total_budget * 0.10))
        
        calc_total = hotel_total + transport_est + food_est + total_ticket_cost + shopping_buffer
        budget_variance = total_budget - calc_total

        return {
            "origin": origin,
            "destination": dest,
            "start_date": start_date_str,
            "days_count": days_count,
            "travelers": num_people,
            "travel_style": travel_style,
            "weather_alert": weather_alert,
            "hotel": recommended_hotel,
            "days": itinerary_days,
            "budget": {
                "total_budget": total_budget,
                "estimated_total": calc_total,
                "per_person_cost": int(calc_total / num_people),
                "variance": budget_variance,
                "status": "Within Budget" if budget_variance >= 0 else "Slightly Over Budget",
                "breakdown": [
                    {"category": "Accommodation", "amount": hotel_total, "share_pct": round((hotel_total / calc_total) * 100, 1)},
                    {"category": "Transportation", "amount": transport_est, "share_pct": round((transport_est / calc_total) * 100, 1)},
                    {"category": "Food & Dining", "amount": food_est, "share_pct": round((food_est / calc_total) * 100, 1)},
                    {"category": "Entry Tickets & Activities", "amount": total_ticket_cost, "share_pct": round((total_ticket_cost / calc_total) * 100, 1)},
                    {"category": "Shopping & Emergency Buffer", "amount": shopping_buffer, "share_pct": round((shopping_buffer / calc_total) * 100, 1)}
                ]
            }
        }