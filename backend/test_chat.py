import asyncio
import json
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        # Get student 1 to ensure exists
        try:
            res = await client.post("http://localhost:8000/api/chat/1/sessions")
            session = res.json()
            session_id = session.get("id")
            print(f"Session ID: {session_id}")
            
            # Send message
            res2 = await client.post(f"http://localhost:8000/api/chat/1/sessions/{session_id}/message", 
                                  json={"content": "Hello", "mode": "casual"})
            print(f"Message Status: {res2.status_code}")
            print(f"Message Response: {res2.json()}")
        except Exception as e:
            print(e)

asyncio.run(test())
