"""esphome-dashboard setup script."""

import os
from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, "README.md"), encoding="utf-8") as readme:
    long_description = readme.read()

setup(
    name="esphome-dashboard",
    version="20240429.1",
    description="ESPHome dashboard",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/esphome/dashboard",
    author="Nabu Casa",
    author_email="hello@nabucasa.com",
    license="Apache-2.0",
    packages=find_packages(include=["esphome_dashboard", "esphome_dashboard.*"]),
    include_package_data=True,
    zip_safe=False,
)
