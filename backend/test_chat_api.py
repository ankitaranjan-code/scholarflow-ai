import asyncio
import httpx

async def test_chat():
    async with httpx.AsyncClient(base_url="http://localhost:8000/api") as client:
        try:
            # 1. Create a session
            print("Creating session for student 1...")
            res1 = await client.post("/chat/1/sessions")
            if res1.status_code != 200:
                print(f"Failed to create session: {res1.status_code}")
                print(res1.text)
                return
                
            session_data = res1.json()
            session_id = session_data.get("id")
            print(f"Session created with ID: {session_id}")
            
            # 2. Send a message
            print(f"Sending message to session {session_id}...")
            res2 = await client.post(
                f"/chat/1/sessions/{session_id}/message",
                json={"content": "how are you", "mode": "casual"}
            )
            
            print(f"Message Status: {res2.status_code}")
            if res2.status_code == 200:
                print(f"Response: {res2.json()}")
            else:
                print(f"Error: {res2.text}")
                
        except Exception as e:
            print(f"Exception during test: {e}")

if __name__ == "__main__":
    asyncio.run(test_chat())
