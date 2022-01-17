from setuptools import setup, find_packages

setup(
    name="esphome-dashboard",
    version="20220116.0",
    description="ESPHome dashboard",
    url="https://github.com/esphome/dashboard",
    author="Nabu Casa",
    author_email="hello@nabucasa.com",
    license="Apache-2.0",
    packages=find_packages(include=["esphome_dashboard", "esphome_dashboard.*"]),
    include_package_data=True,
    zip_safe=False,
)
