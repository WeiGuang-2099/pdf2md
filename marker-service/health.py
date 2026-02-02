"""
Simple health check script for Marker service
"""
import sys
import requests
import time


def check_marker_service(host="http://localhost", port=8001, timeout=30):
    """
    Check if Marker service is healthy
    
    Args:
        host: Marker service host
        port: Marker service port
        timeout: Request timeout in seconds
    
    Returns:
        bool: True if service is healthy
    """
    url = f"{host}:{port}/health"
    
    for attempt in range(timeout):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"Marker service is healthy: {data}")
                return True
        except requests.exceptions.ConnectionError:
            print(f"Attempt {attempt + 1}/{timeout}: Waiting for service to start...")
            time.sleep(1)
        except Exception as e:
            print(f"Error checking health: {e}")
            time.sleep(1)
    
    print(f"Marker service is not healthy after {timeout} seconds")
    return False


if __name__ == "__main__":
    success = check_marker_service()
    sys.exit(0 if success else 1)
