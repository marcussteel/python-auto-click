from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time
import pyautogui


opt = Options()
opt.add_experimental_option("debuggerAddress", "localhost:8982")
driver = webdriver.Chrome(
    executable_path="C:/Users/musta/Desktop/click/chromedriver.exe", chrome_options=opt)
# driver.get("https://...........")

for i in range(350):
    pyautogui.dragTo(100, 150)
    print('-------------------------------Click Deneme Sayısı :',i)
    driver.execute_script("window.scrollTo(0,document.body.scrollHeight)")
    time.sleep(2)
    ileri = driver.find_element(
        By.XPATH, '/html/body/in-root/in-users/in-dashboard-layout/main/in-lecture/div/div[1]/div/div[2]/span[2]/in-loading-button/dx-button/div/span')

    ileri.click()
    pyautogui.dragTo(150, 100)
    for x in range(60):
        time.sleep(1)
        print(x)


